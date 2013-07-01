#!vpy/bin/python
from cherrypy import wsgiserver
from slickqaweb.app import app

d = wsgiserver.WSGIPathInfoDispatcher({'/': app})
server = wsgiserver.CherryPyWSGIServer(('0.0.0.0', 9000), d)

if __name__ == '__main__':
   try:
      server.start()
   except KeyboardInterrupt:
      server.stop()
