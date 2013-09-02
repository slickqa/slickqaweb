#!vpy/bin/python
from cherrypy import wsgiserver
from slickqaweb.main import app

d = wsgiserver.WSGIPathInfoDispatcher({'/': app})
server = wsgiserver.CherryPyWSGIServer(('0.0.0.0', 9000), d)
server.minthreads = 10

if __name__ == '__main__':
   try:
      server.start()
   except KeyboardInterrupt:
      server.stop()
