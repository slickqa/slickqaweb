Ubuntu Deployment Documentation
===============================

This document assumes that you are deploying on the newest version of Ubuntu,
13.10 as of this writing.  A script is provided that follows these directions.

Prerequisites
-------------

Slick needs a few things on the system before it can work.  Provided below
is a list, and the shell commands (as root) that are needed to get it working.

  1. Python 2.7 with development files
     
        apt-get install python-dev
  2. Development tools

        apt-get install build-essential
  3. Python packages: setuptools, pip, and virtualenv

        apt-get install python-setuptools python-pip python-virtualenv
  4. NodeJS interpreter, with npm tool

  5. less compiler

  6. MongoDB

  7. Apache with mod_wsgi
