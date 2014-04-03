__author__ = 'jcorbett'

from slickqaweb.app import app
from flask import request, Response
from bson import ObjectId
from slickqaweb.model.storedFile import StoredFile
from slickqaweb.model.fileChunk import FileChunk
from slickqaweb.model.serialize import deserialize_that
from .standardResponses import JsonResponse, read_request
from hashlib import md5
import re
import logging
from apidocs import add_resource, accepts, returns, argument_doc, note
from mongoengine import ListField, EmbeddedDocumentField, ReferenceField, BinaryField

add_resource('/files', 'Upload, or Download files on slick.')

@app.route("/api/files/<file_id>")
@argument_doc('file_id', 'The id (string representation of the ObjectID) of the stored file.')
@returns(StoredFile)
def get_stored_file(file_id):
    """Get the "stored file" or the summary about the file."""
    return JsonResponse(StoredFile.objects(id=ObjectId(file_id)).first())

@app.route("/api/files/<file_id>", methods=["PUT"])
@argument_doc('file_id', 'The id (string representation of the ObjectID) of the stored file.')
@accepts(StoredFile)
@returns(StoredFile)
def update_stored_file(file_id):
    """Update the properties of a stored file, you only have to include changed properties"""
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    stored_file = deserialize_that(read_request(), stored_file)
    stored_file.save()
    return JsonResponse(stored_file)

@app.route("/api/files", methods=["POST"])
@accepts(StoredFile)
@returns(StoredFile)
@note("The chunkSize will be set by the server for you, even if you provide it.  Make sure you supply a valid mimetype.")
def create_stored_file():
    """Create a new StoredFile object to store file content for."""
    new_stored_file = deserialize_that(read_request(), StoredFile())
    new_stored_file.chunkSize = 262144
    new_stored_file.save()
    return JsonResponse(new_stored_file)

@app.route("/api/files/<file_id>/content", methods=["POST"])
@argument_doc('file_id', 'The id (string representation of the ObjectID) of the stored file.')
@accepts(BinaryField(help_text="binary data of file"))
@returns(StoredFile)
@note("Use is not recommended unless your file is really small.  Instead add individual chunks to the file.")
def set_file_content(file_id):
    """Upload all the content at once (for small files)."""
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    data = request.data
    stored_file.md5 = md5(data).hexdigest()
    stored_file.length = len(data)
    num_of_chunks = len(data) / 262144
    if (len(data) % 262144) > 0:
        num_of_chunks += 1
    for i in range(num_of_chunks):
        chunk = FileChunk()
        chunk.files_id = stored_file.id
        chunk.n = i
        chunk.data = data[i * 262144:(i + 1) * 262144]
        chunk.save()
    stored_file.save()
    return JsonResponse(stored_file)

@app.route("/api/files/<file_id>/addchunk", methods=["POST"])
@argument_doc('file_id', 'The id (string representation of the ObjectID) of the stored file.')
@accepts(BinaryField(help_text="binary data of the chunk."))
@returns(StoredFile)
def add_chunk_to_file(file_id):
    """Add content to a file (chunk by chunk)."""
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    num_of_chunks = len(FileChunk.objects(files_id=stored_file.id))
    chunk = FileChunk()
    chunk.files_id = stored_file.id
    chunk.n = num_of_chunks
    chunk.data = request.data
    chunk.save()
    stored_file.length += len(request.data)
    stored_file.save()
    return JsonResponse(stored_file)

#@app.route("/api/files/<file_id>/content/<filename>", methods=["HEAD"])
#def get_header_for_file(file_id, filename):
#    logger = logging.getLogger('slickqaweb.api.files.get_header_for_file')
#    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
#    if stored_file is None:
#        return Response("File with id '{}' and name '{}' not found.".format(file_id, filename), mimetype="text/plain", status=404)
#    logger.debug("Returning header information for file with id {} and name {}".format(file_id, filename))



@app.route("/api/files/<file_id>/content/<filename>")
@argument_doc('file_id', 'The id (string representation of the ObjectID) of the stored file.')
@argument_doc('filename', 'The filename of the stored file.  This is actually ignored, but makes for nice looking URLs.')
@returns(BinaryField(help_text="The file content."))
@note("This sets the http header to the mimetype from the stored file, and streams the file to the requester.")
def get_file_content(file_id, filename):
    """Get the content of a file."""
    logger = logging.getLogger('slickqaweb.api.files.get_file_content')
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    if stored_file is None:
        return Response("File with id '{}' and name '{}' not found.".format(file_id, filename), mimetype="text/plain", status=404)

    range_header = request.headers.get('Range', None)
    response = None
    if not range_header:
        logger.info("Returning file in classic mode")
        def write_chunks():
            for chunk in FileChunk.objects(files_id=stored_file.id).order_by('+n'):
                yield chunk.data
        response = Response(write_chunks(), mimetype=stored_file.mimetype, direct_passthrough=True)
    else:
        logger.debug("Returning file with id {} and filename {} and md5sum {} in ranged mode.".format(file_id, filename, stored_file.md5))
        byte1, byte2 = 0, (stored_file.length - 1)

        m = re.search('(\d+)-(\d*)', range_header)
        g = m.groups()

        if g[0]:
            byte1 = int(g[0])
        if g[1]:
            possible_byte2 = int(g[1])
            if possible_byte2 < byte2:
                byte2 = possible_byte2

        data = []
        start_chunk_number = byte1 / stored_file.chunkSize
        end_chunk_number = byte2 / stored_file.chunkSize
        if byte2 % stored_file.chunkSize > 0:
            end_chunk_number += 1
        start_index = byte1 % stored_file.chunkSize
        end_index = byte2 % stored_file.chunkSize

        logger.debug("Using range information {}-{}/{}, chunks {}:{}-{}:{}".format(byte1, byte2, stored_file.length - 1, start_chunk_number, start_index, end_chunk_number, end_index))

        def write_chunks():
            for chunk in FileChunk.objects(files_id=stored_file.id).order_by('+n'):
                if chunk.n >= start_chunk_number and chunk.n <= end_chunk_number:
                    start = 0
                    end = stored_file.chunkSize
                    if chunk.n == start_chunk_number:
                        start = start_index
                    if chunk.n == end_chunk_number:
                        end = end_index
                    yield chunk.data[start:end]

        response = Response(write_chunks(), 206, mimetype=stored_file.mimetype, direct_passthrough=True)
        response.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(byte1, byte2, stored_file.length))

    response.headers.add('Accept-Ranges', 'bytes')
    return response



