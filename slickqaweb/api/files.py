__author__ = 'jcorbett'

from slickqaweb.app import app
from flask import request
from bson import ObjectId
from slickqaweb.model.storedFile import StoredFile
from slickqaweb.model.fileChunk import FileChunk
from slickqaweb.model.serialize import deserialize_that
from .standardResponses import JsonResponse
from hashlib import md5

@app.route("/api/files/<file_id>")
def get_stored_file(file_id):
    return JsonResponse(StoredFile.objects(id=ObjectId(file_id)).first())

@app.route("/api/files/<file_id>", methods=["PUT"])
def update_stored_file(file_id):
    stored_file = StoredFile.objects(id=ObjectId(file_id)).first()
    stored_file = deserialize_that(request.get_json(), stored_file)
    stored_file.save()
    return JsonResponse(stored_file)

@app.route("/api/files", methods=["POST"])
def create_stored_file():
    new_stored_file = deserialize_that(request.get_json(), StoredFile())
    new_stored_file.chunkSize = 262144
    new_stored_file.save()
    return JsonResponse(new_stored_file)

@app.route("/api/files/<file_id>/content")
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


