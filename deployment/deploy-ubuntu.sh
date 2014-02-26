#!/bin/bash

apt-get -y install python3-software-properties software-properties-common
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list
add-apt-repository -y ppa:chris-lea/node.js
apt-get update
apt-get -y dist-upgrade

apt-get -y install python-dev build-essential python-setuptools python-pip python-virtualenv nodejs mongodb-10gen apache2 libapache2-mod-wsgi git

npm install -g less

adduser --system --home /opt/slick --disabled-password --disabled-login slick

cd /opt
su slick -s /bin/bash -c "/bin/bash -c 'git clone http://github.com/slickqa/slickqaweb slick'"
        
cd /opt/slick
su slick -s /bin/bash -c "/bin/bash -c './devenv.sh'"

cd /opt/slick
su slick -s /bin/bash -c "/bin/bash -c 'cp deployment/prodserver.example.cfg prodserver.cfg'"
su slick -s /bin/bash -c "/bin/bash -c 'cp deployment/slick.example.wsgi slick.wsgi'"

cp /opt/slick/deployment/example.apache.conf /etc/apache2/sites-available/slick.conf
a2ensite slick
service apache2 reload
