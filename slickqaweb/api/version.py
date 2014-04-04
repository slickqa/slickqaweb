__author__ = 'jcorbett'

from slickqaweb.app import app
from .standardResponses import JsonResponse
from slickqaweb.model.productVersion import ProductVersion
from apidocs import add_resource, returns, note
from mongoengine import ListField, ReferenceField

add_resource('/version', 'Get slick version information')

@app.route('/api/version')
@returns(ListField(ReferenceField(ProductVersion)))
@note("This returns an array, but right now it's guaranteed to only have one element in it, the slick version.")
def get_version():
    """Get the slick version"""
    slickversion = ProductVersion()
    slickversion.productName = "slick"
    slickversion.versionString = "3.0.0.0.0.0"
    return JsonResponse([slickversion,])
