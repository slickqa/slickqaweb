Setup for Developers
=====================

You need a few things to get started:
  * nodejs, npm
    * lesscss compiler `sudo npm install -g less`
    * bower `sudo npm install -g bower`
  * python 2.7
  * pip
  * virtualenv `pip install virtualenv`

For Ubuntu (recent release):
  * Install NodeJS: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
  * Install pip, virtualenv: `sudo apt-get install python-pip python-virtualenv`
  * use npm to install bower and less: `sudo npm install -g bower` and `sudo npm install -g less`

Then after you have that you should run devenv.sh to initialize your environment.

Then run ./devserver.sh to get a server started.
