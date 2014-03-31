__author__ = 'jcorbett'


from slickqaweb.app import app
from .standardResponses import JsonResponse
from mongoengine import *
from flask import request
import re


#------------- For documenting other API endpoints ---------------------------
resources = []


def add_resource(path, description):
    resources.append(SwaggerApiDescription(path=path, description=description))


def returns(datatype):
    def returns_datatype(f):
        f.returns = datatype
        return f
    return returns_datatype


def accepts(datatype):
    def accepts_datatype(f):
        f.accepts = datatype
        return f
    return accepts_datatype


def argument_doc(name, description, argtype="string"):
    def argdoc(f):
        if not hasattr(f, 'argument_docs'):
            f.argument_docs = {}
        if not hasattr(f, 'argument_types'):
            f.argument_types = {}
        f.argument_docs[name] = description
        f.argument_types[name] = argtype
        return f
    return argdoc



#------------- API Endpoints for the Docs ------------------------------------
@app.route("/api/api-docs")
def get_swagger_toplevel():
    return JsonResponse(SwaggerApiDocs())


@app.route("/api/api-docs/<resource_name>")
def get_swagger_for_resource(resource_name):
    for resource in resources:
        if resource.path == "/{}".format(resource_name):
            return JsonResponse(get_endpoint_doc(resource))
    return JsonResponse(None)

#------------- Models and methods for generating docs ------------------------

def get_endpoint_doc(resource):
    retval = SwaggerResource(resourcePath=resource.path)
    retval.apis = []
    rules = []
    for rule in app.url_map.iter_rules():
        if rule.rule.startswith("/api{}".format(resource.path)):
            rules.append(rule)
    for rule in rules:
        endpoint = SwaggerApiEndpoint()
        endpoint.path = re.sub("^/api", "", rule.rule)
        endpoint.path = re.sub("<", "{", endpoint.path)
        endpoint.path = re.sub(">", "}", endpoint.path)
        endpoint.operations = []
        for method in rule.methods:
            if method in ["GET", "DELETE", "POST", "PUT"]:
                operation = SwaggerOperation()
                operation.method = method
                operation.nickname = rule.endpoint
                function = app.view_functions[rule.endpoint]
                operation.summary = function.__doc__
                operation.parameters = []
                for argument in rule.arguments:
                    parameter = SwaggerParameter()
                    parameter.name = argument
                    parameter.paramType = "path"
                    parameter.allowMultiple = False
                    if hasattr(function, 'argument_docs') and argument in function.argument_docs:
                        parameter.description = function.argument_docs[argument]
                    if hasattr(function, 'argument_types') and argument in function.argument_types:
                        parameter.type = function.argument_types[argument]
                    else:
                        parameter.type = "string"
                    operation.parameters.append(parameter)
                if hasattr(function, 'returns'):
                    operation.type = function.returns.__name__
                    add_swagger_model(retval, function.returns)
                if hasattr(function, 'accepts'):
                    parameter = SwaggerParameter()
                    parameter.name = "body"
                    parameter.paramType = "body"
                    parameter.allowMultiple = False
                    parameter.type = function.accepts.__name__
                    add_swagger_model(retval, function.accepts)
                    operation.parameters.append(parameter)
                endpoint.operations.append(operation)
        retval.apis.append(endpoint)

    return retval

class SwaggerInfo(EmbeddedDocument):
    contact = StringField(required=True, default="slick-users@googlegroups.com")
    license = StringField(required=True, default="Apache 2.0")
    licenseUrl = StringField(required=True, default="http://www.apache.org/licenses/LICENSE-2.0.html")
    title = StringField(required=True, default="Slick Test Manager")


class SwaggerAuthorizations(EmbeddedDocument):
    pass


class SwaggerApiDescription(EmbeddedDocument):
    description = StringField()
    path = StringField()


class SwaggerApiDocs(EmbeddedDocument):
    apiVersion = StringField(required=True, default="1.0.0")
    swaggerVersion = StringField(required=True, default="1.2")
    info = EmbeddedDocumentField(SwaggerInfo, default=SwaggerInfo())
    authorizations = EmbeddedDocumentField(SwaggerAuthorizations, default=SwaggerAuthorizations())
    apis = ListField(EmbeddedDocumentField(SwaggerApiDescription), required=True, default=resources)


def generate_base_path():
    return re.sub("api/.*$", "api", request.base_url)


class SwaggerProperty(EmbeddedDocument):
    description = StringField()
    format = StringField()
    type = StringField()
    enum = ListField(StringField(), default=None)
    items = MapField(StringField(), default=None)


class SwaggerModel(EmbeddedDocument):
    id = StringField()
    description = StringField()
    properties = MapField(EmbeddedDocumentField(SwaggerProperty))
    required = ListField(StringField())


class SwaggerParameter(EmbeddedDocument):
    name = StringField()
    paramType = StringField()
    description = StringField()
    required = BooleanField()
    type = StringField()
    allowMultiple = BooleanField()


class SwaggerOperation(EmbeddedDocument):
    method = StringField()
    nickname = StringField()
    notes = StringField()
    summary = StringField()
    type = StringField()
    parameters = ListField(EmbeddedDocumentField(SwaggerParameter))
    produces = ListField(StringField(), default=["application/json"])


class SwaggerApiEndpoint(EmbeddedDocument):
    path = StringField()
    operations = ListField(EmbeddedDocumentField(SwaggerOperation))


class SwaggerResource(EmbeddedDocument):
    apiVersion = StringField(required=True, default="1.0.0")
    swaggerVersion = StringField(required=True, default="1.2")
    resourcePath = StringField()
    basePath = StringField(required=True, default=generate_base_path)
    models = MapField(EmbeddedDocumentField(SwaggerModel))
    apis = ListField(EmbeddedDocumentField(SwaggerApiEndpoint))


def add_swagger_model(resource, modeltype):
    if not hasattr(resource, 'models'):
        resource.models = dict()
    if modeltype.__name__ in resource.models:
        return
    model = SwaggerModel()
    model.id = modeltype.__name__
    if modeltype.__doc__:
        model.description = modeltype.__doc__
    model.properties = dict()
    for fieldname, fieldtype in modeltype._fields.iteritems():
        property = SwaggerProperty()
        if hasattr(fieldtype, 'help_text'):
            property.description = fieldtype.help_text
        if isinstance(fieldtype, StringField):
            if fieldtype.choices is not None:
                property.enum = []
                property.enum = fieldtype.choices
            property.type = "string"
        elif isinstance(fieldtype, ObjectIdField):
            property.type = "string"
            property.description = "a BSON ObjectId String representation"
        elif isinstance(fieldtype, DateTimeField):
            property.type = "integer"
            property.format = "int64"
            property.description = "The date and time in the milliseconds since UNIX Epoch GMT"
        elif isinstance(fieldtype, ListField):
            property.type = "array"
            property.items = {}
            if isinstance(fieldtype.field, (ReferenceField, EmbeddedDocumentField)):
                property.items["$ref"] = fieldtype.field.document_type.__name__
                add_swagger_model(resource, fieldtype.field.document_type)
        elif isinstance(fieldtype, EmbeddedDocumentField):
            property.type = fieldtype.document_type.__name__
            add_swagger_model(resource, fieldtype.document_type)
        else:
            property = None
        if property is not None:
            model.properties[fieldname] = property

    resource.models[model.id] = model
