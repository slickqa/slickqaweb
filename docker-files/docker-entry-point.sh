#!/bin/bash

cp /opt/slick/docker-files/prodserver.cfg /opt/slick/prodserver.cfg
rm /var/run/control.unit.sock

if [ "${APPLICATION_ROOT}z" != "z" ];
then
	echo "APPLICATION_ROOT = \"${APPLICATION_ROOT}\"" >> /opt/slick/prodserver.cfg
else
	echo "APPLICATION_ROOT = \"/\"" >> /opt/slick/prodserver.cfg
fi

if [ "${MONGODB_HOSTNAME}z" != "z" ];
then
	echo "MONGODB_HOSTNAME = \"${MONGODB_HOSTNAME}\"" >> /opt/slick/prodserver.cfg
else
	echo "MONGODB_HOSTNAME = \"mongo\"" >> /opt/slick/prodserver.cfg
fi

if [ "${MONGODB_DBNAME}z" != "z" ];
then
	echo "MONGODB_DBNAME = \"${MONGODB_DBNAME}\"" >> /opt/slick/prodserver.cfg
else
	echo "MONGODB_DBNAME = \"slick\"" >> /opt/slick/prodserver.cfg
fi

if [ "${MONGODB_USERNAME}z" != "z" ];
then
	echo "MONGODB_USERNAME = \"${MONGODB_USERNAME}\"" >> /opt/slick/prodserver.cfg
fi

if [ "${MONGODB_PASSWORD}z" != "z" ];
then
	echo "MONGODB_PASSWORD = \"${MONGODB_PASSWORD}\"" >> /opt/slick/prodserver.cfg
fi

if [ "${MONGODB_AUTHDB}z" != "z" ];
then
	echo "MONGODB_AUTHDB = \"${MONGODB_AUTHDB}\"" >> /opt/slick/prodserver.cfg
fi


/usr/sbin/unitd --no-daemon &
/usr/bin/env python /opt/slick/add-indexes.py
curl -X PUT -d @/opt/slick/nginx-unit-conf.json --unix-socket /var/run/control.unit.sock http://localhost

wait

