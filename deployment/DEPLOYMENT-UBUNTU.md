Ubuntu Deployment Documentation
===============================

This document assumes that you are deploying on the newest version of Ubuntu,
13.10 as of this writing.  A script is provided that follows these directions.

To deploy on ubuntu run the following command on a freshly installed ubuntu
server:

        wget -q -O - https://raw.github.com/slickqa/slickqaweb/master/deployment/deploy-ubuntu.sh |sudo bash

Prerequisites
-------------

Slick needs a few things on the system before it can work.  Provided below
is a list, and the shell commands (as root) that are needed to get it working.

  1. Install all updates

        apt-get update
        apt-get -y dist-upgrade
  2. Python 2.7 with development files
     
        apt-get -y install python-dev
  3. Development tools

        apt-get -y install build-essential
  4. Python packages: setuptools, pip, and virtualenv

        apt-get -y install python-setuptools python-pip python-virtualenv
  5. NodeJS interpreter, with npm tool

        apt-get -y install python3-software-properties software-properties-common
        add-apt-repository -y ppa:chris-lea/node.js
        apt-get -y update
        apt-get -y install nodejs
  6. less compiler

        npm install -g less
  7. MongoDB

        apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
        echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list
        apt-get update
        apt-get -y install mongodb-10gen
  7. Apache with mod_wsgi

        apt-get -y install apache2 libapache2-mod-wsgi

  8. Git

        apt-get -y install git


Install Process
---------------

The following is the recommended install process. There are probably a lot of ways to
install and deploy slick, and you are welcome to try them out.  These instructions are
tested and confirmed to work.

  1. First create a slick user.  This is for security.  When slick runs as a separate user
     there is less of a chance that any undiscovered security flaws could cause catastrophic
     problems with your system.

        adduser --system --home /opt/slick --disabled-password --disabled-login slick
  2. Get slick files.  As slick is currently in high development, we are going to use git to
     checkout the latest files.  If there is a tagged release you may need to adjust the
     command line.

        cd /opt
        su slick -s /bin/bash -c "/bin/bash -c 'git clone http://github.com/slickqa/slickqaweb slick'"
  3. Prepare the virtual python environment with everything we need.  This is the same as
     for getting a development environment ready.
        
        cd /opt/slick
        su slick -s /bin/bash -c "/bin/bash -c './devenv.sh'"
  4. Get slick configuration setup.  There is an example production config in the deployment
     directory.  You can edit to your taste, but for this example, we will use it without
     any changes.
     
        cd /opt/slick
        su slick -s /bin/bash -c "/bin/bash -c 'cp deployment/prodserver.example.cfg prodserver.cfg'"

  5. Get the slick.wsgi file ready.  There is an example one, and generally it can be used,
     but you should check it to see if it is doing what you want.  If your following this
     tutorial without changing anything, then what is there will probably be fine.

        cd /opt/slick
        su slick -s /bin/bash -c "/bin/bash -c 'cp deployment/slick.example.wsgi slick.wsgi'"
  6. Configure Apache.  There is an example apache configuration file that we will put
     in the sites directory of apache and use.  If you are customizing where slick lives
     be sure to change this file!

        cp /opt/slick/deployment/example.apache.conf /etc/apache2/sites-available/slick.conf
        a2ensite slick
        service apache2 reload

That's it!  Now you should be able to go to http://your-ip-address/slick/ and see slick in all
it's wonder.  Happy slicking!

