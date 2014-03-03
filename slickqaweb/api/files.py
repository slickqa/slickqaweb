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

@app.route("/api/files/<file_id>")
def get_stored_file(file_id):
    return JsonResponse(StoredFile.objects(id=ObjectId(file_id)).first())

@app.route("/api/files/<file_id>", methods=["PUT"])
def update_stored_file(file_id):
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    stored_file = deserialize_that(read_request(), stored_file)
    stored_file.save()
    return JsonResponse(stored_file)

@app.route("/api/files", methods=["POST"])
def create_stored_file():
    new_stored_file = deserialize_that(read_request(), StoredFile())
    new_stored_file.chunkSize = 262144
    new_stored_file.save()
    return JsonResponse(new_stored_file)

@app.route("/api/files/<file_id>/content", methods=["POST"])
def set_file_content(file_id):
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
def add_chunk_to_file(file_id):
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
def get_file_content(file_id, filename):
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



