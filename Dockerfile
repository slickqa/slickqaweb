FROM ubuntu:16.04
LABEL maintainer "Jaron Jones"

# Install
RUN apt-get update; apt-get -y dist-upgrade; apt-get install -y python-dev python-pip build-essential python-setuptools python-virtualenv nodejs npm apache2 libapache2-mod-wsgi git
RUN adduser --system --home /opt/slick --disabled-password --disabled-login slick

# get slick and dependencies
COPY . /opt/slick/
RUN chown -R slick /opt/slick; npm install -g less; pip install --upgrade pip; pip install -r /opt/slick/requirements.txt;

#set the slick configs in place and kick the apache HTTP service
RUN cp -a /opt/slick/docker-files/* /opt/slick/; ln -s /opt/slick/apache.conf /etc/apache2/sites-available/slick.conf; a2ensite slick; rm -f /usr/bin/node; ln -s /usr/bin/nodejs /usr/bin/node

# expose our volumes
VOLUME ["/opt/slick", "/var/log/apache2"]

ENTRYPOINT ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]

