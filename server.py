#!vpy/bin/python
import cherrypy
from slickqaweb.main import app

base = app.config['APPLICATION_ROOT']
if base is None:
    base = "/"
#d = wsgiserver.WSGIPathInfoDispatcher({base: app})
#server = wsgiserver.CherryPyWSGIServer(('0.0.0.0', 9000), d)
#server.minthreads = 10

cherrypy.tree.graft(app, base)
cherrypy.config.update({
    'engine.autoreload_on': True,
    'server.socket_port': 9000,
    'server.socket_host': '0.0.0.0'
})

if __name__ == '__main__':
   try:
      cherrypy.engine.start()
      cherrypy.engine.block()
   except KeyboardInterrupt:
      cherrypy.engine.stop()
