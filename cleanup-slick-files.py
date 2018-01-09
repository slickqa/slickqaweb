#!/usr/bin/env python

import sys
from pymongo import MongoClient
from datetime import datetime, timedelta
import time
import pytz
from pymongo.errors import CursorNotFound


client = MongoClient('mongodb://localhost')
slickdb = client['slick']

oldest_file_timestamp = datetime.now(tz=pytz.timezone('America/Denver')) - timedelta(days=90)
counter = 0
keepGoing = True
while keepGoing:
    try:
        for slick_file in slickdb['fs.files'].find().sort('_id'):
            if slick_file['_id'].generation_time < oldest_file_timestamp:
                counter += 1
                month = slick_file['_id'].generation_time.month
                day = slick_file['_id'].generation_time.day
                year = slick_file['_id'].generation_time.year
                sys.stdout.write('Deleting file {} from date {}-{}-{} with name: {}                                                      \r'.format(counter, year, month, day, slick_file['filename'].strip()))
                sys.stdout.flush()
                slickdb['fs.chunks'].delete_many({'files_id': slick_file['_id']})
                slickdb['fs.files'].delete_one({'_id': slick_file['_id']})
                time.sleep(.01)
        keepGoing = False
    except CursorNotFound:
        pass
