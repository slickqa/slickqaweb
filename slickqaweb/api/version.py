__author__ = 'jcorbett'

from slickqaweb.app import app
from .standardResponses import JsonResponse
from slickqaweb.model.productVersion import ProductVersion

@app.route('/api/version')
def get_version():
    slickversion = ProductVersion()
    slickversion.productName = "slick"
    slickversion.versionString = "3.0.0.0.0.0"
    return JsonResponse([slickversion,])
