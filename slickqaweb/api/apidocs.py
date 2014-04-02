__author__ = 'jcorbett'


from slickqaweb.app import app
from .standardResponses import JsonResponse
from mongoengine import *
from flask import request
import re
import types


#------------- For documenting other API endpoints ---------------------------
resources = []

def standard_query_parameters(f):
    if not hasattr(f, 'argument_docs'):
        f.argument_docs = {}
    if not hasattr(f, 'argument_types'):
        f.argument_types = {}
    if not hasattr(f, 'argument_param_types'):
        f.argument_param_types = {}
    f.argument_docs['q'] = "Slick query string"
    f.argument_docs['orderby'] = "Property to sort by.  Use - before property name to reverse sort order."
    f.argument_docs['limit'] = "Limit the number of items to query."
    f.argument_docs['skip'] = "Skip past a certain number of results."
    f.argument_types['q'] = "string"
    f.argument_types['orderby'] = "string"
    f.argument_types['limit'] = "integer"
    f.argument_types['skip'] = "integer"
    f.argument_param_types['q'] = "query"
    f.argument_param_types['orderby'] = "query"
    f.argument_param_types['limit'] = "query"
    f.argument_param_types['skip'] = "query"
    return f


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


def argument_doc(name, description, argtype="string", paramtype="path"):
    def argdoc(f):
        if not hasattr(f, 'argument_docs'):
            f.argument_docs = {}
        if not hasattr(f, 'argument_types'):
            f.argument_types = {}
        if not hasattr(f, 'argument_param_types'):
            f.argument_param_types = {}
        f.argument_docs[name] = description
        f.argument_types[name] = argtype
        f.argument_param_types[name] = paramtype
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
                arguments = set(rule.arguments)
                if hasattr(function, 'argument_docs'):
                    arguments = arguments.union(set(function.argument_docs.keys()))
                for argument in arguments:
                    parameter = SwaggerParameter()
                    parameter.name = argument
                    parameter.allowMultiple = False
                    if hasattr(function, 'argument_docs') and argument in function.argument_docs:
                        parameter.description = function.argument_docs[argument]
                    if hasattr(function, 'argument_types') and argument in function.argument_types:
                        parameter.type = function.argument_types[argument]
                    else:
                        parameter.type = "string"
                    if hasattr(function, 'argument_param_types') and argument in function.argument_param_types:
                        parameter.paramType = function.argument_param_types[argument]
                    else:
                        parameter.paramType = "path"
                    operation.parameters.append(parameter)
                if hasattr(function, 'returns'):
                    add_type_properties(operation, function.returns, retval)
                else:
                    operation.type = "void"
                if hasattr(function, 'accepts'):
                    parameter = SwaggerParameter()
                    parameter.name = "body"
                    parameter.paramType = "body"
                    parameter.allowMultiple = False
                    add_type_properties(parameter, function.accepts, retval)
                    operation.parameters.append(parameter)
                endpoint.operations.append(operation)
        retval.apis.append(endpoint)

    return retval


def get_type_name(from_type):
    if isinstance(from_type, (type, types.ClassType)) and (issubclass(from_type, Document) or issubclass(from_type, EmbeddedDocument)):
        return from_type.__name__
    if isinstance(from_type, StringField):
        return "string"
    if isinstance(from_type, ListField):
        return "array"
    if isinstance(from_type, IntField):
        return "integer"
    if isinstance(from_type, LongField):
        return "integer"
    if isinstance(from_type, FloatField):
        return "number"
    if isinstance(from_type, BooleanField):
        return "boolean"
    if isinstance(from_type, DateTimeField):
        return "integer"
    if isinstance(from_type, ObjectIdField):
        return "string"
    if isinstance(from_type, (EmbeddedDocumentField, ReferenceField)):
        return from_type.document_type.__name__


def get_format_name(from_type):
    if isinstance(from_type, IntField):
        return "int32"
    if isinstance(from_type, LongField):
        return "int64"
    if isinstance(from_type, FloatField):
        return "float"
    if isinstance(from_type, DateTimeField):
        return "int64"


def get_override_description(from_type):
    if isinstance(from_type, ObjectIdField):
        return "A String representation of a BSON ObjectId"
    if isinstance(from_type, DateTimeField):
        return "The number of milliseconds since EPOCH GMT"

def add_type_properties(to, from_type, resource):
    if hasattr(from_type, 'help_text'):
        to.description = from_type.help_text
    to.type = get_type_name(from_type)

    format = get_format_name(from_type)
    if format is not None:
        to.format = format

    description = get_override_description(from_type)
    if description is not None:
        to.description = description

    if isinstance(from_type, (type, types.ClassType)) and (issubclass(from_type, Document) or issubclass(from_type, EmbeddedDocument)):
        add_swagger_model(resource, from_type)
    elif isinstance(from_type, StringField):
        if hasattr(from_type, 'choices'):
            to.enum = []
            to.enum = from_type.choices
    elif isinstance(from_type, ListField):
        to.items = dict()
        to.items['type'] = get_type_name(from_type.field)
        if isinstance(from_type.field, (type, types.ClassType)) and (issubclass(from_type.field, Document) or issubclass(from_type.field, EmbeddedDocument)):
            add_swagger_model(resource, from_type.field)
        elif isinstance(from_type.field, (EmbeddedDocumentField, ReferenceField)):
            add_swagger_model(resource, from_type.field.document_type)
    elif isinstance(from_type, (EmbeddedDocumentField, ReferenceField)):
        add_swagger_model(resource, from_type.document_type)

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
    format = StringField()
    enum = ListField(StringField(), default=None)
    items = MapField(StringField(), default=None)
    allowMultiple = BooleanField()


class SwaggerOperation(EmbeddedDocument):
    method = StringField()
    nickname = StringField()
    notes = StringField()
    summary = StringField()
    type = StringField()
    format = StringField()
    enum = ListField(StringField(), default=None)
    items = MapField(StringField(), default=None)
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
        add_type_properties(property, fieldtype, resource)
        if property.type is None:
            property = None
        if property is not None:
            model.properties[fieldname] = property
    if hasattr(modeltype, 'dynamic_types'):
        for fieldname, fieldtype in modeltype.dynamic_types.iteritems():
            property = SwaggerProperty()
            add_type_properties(property, fieldtype, resource)
            if property.type is None:
                property = None
            if property is not None:
                model.properties[fieldname] = property

    resource.models[model.id] = model
