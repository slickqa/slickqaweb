#!vpy/bin/python

import pymongo
import sys
import configparser
import shutil

prod_config='/opt/slick/prodserver.cfg'
mongo_config='/opt/slick/mongo.cfg'
shutil.copy(prod_config, mongo_config)
header="[defaults]"
with open(mongo_config, 'r+') as f:
    file_data = f.read()
    f.seek(0,0)
    f.write(header.rstrip('\r\n') + '\n' + file_data)

config=configparser.ConfigParser()
config.read(mongo_config)

hostName = config["defaults"]["MONGODB_HOSTNAME"].replace("\"", "")
dbName = config["defaults"]["MONGODB_DBNAME"].replace("\"", "")

client = pymongo.MongoClient(host=hostName, port=27017)
db = client[dbName]

sys.stdout.write("Creating index on projects...")
sys.stdout.flush()
db.projects.ensure_index([("name", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating indexes on configurations...")
sys.stdout.flush()
db.configurations.ensure_index([("name", pymongo.ASCENDING)])
db.configurations.ensure_index([("configurationType", pymongo.ASCENDING)])
db.configurations.ensure_index([("filename", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating indexes on testcases...")
sys.stdout.flush()
db.testcases.ensure_index([("automationId", pymongo.ASCENDING)])
db.testcases.ensure_index([("automationKey", pymongo.ASCENDING)])
db.testcases.ensure_index([("project.id", pymongo.ASCENDING), ("component.id", pymongo.ASCENDING)])
db.testcases.ensure_index([("tags", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating indexes on results (could take a while)...")
sys.stdout.flush()
db.results.ensure_index([("runstatus", pymongo.ASCENDING), ("hostname", pymongo.ASCENDING)])
db.results.ensure_index([("runstatus", pymongo.ASCENDING), ("testcase.automationTool", pymongo.ASCENDING), ("recorded", pymongo.DESCENDING)])
db.results.ensure_index([("testrun.testrunId", pymongo.ASCENDING), ("status", pymongo.ASCENDING), ("recorded", pymongo.DESCENDING)])
db.results.ensure_index([("build.buildId", pymongo.ASCENDING), ("status", pymongo.ASCENDING)])
db.results.ensure_index([("testcase.testcaseId", pymongo.ASCENDING), ("config.configId", pymongo.ASCENDING), ("release.releaseId", pymongo.ASCENDING), ("recorded", pymongo.DESCENDING)])
db.results.ensure_index([("testcase.testcaseId", pymongo.ASCENDING), ("recorded", pymongo.DESCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating indexes on testruns...")
sys.stdout.flush()
db.testruns.ensure_index([("project.id", pymongo.ASCENDING), ("release.releaseId", pymongo.ASCENDING)])
db.testruns.ensure_index([("project.id", pymongo.ASCENDING), ("dateCreated", pymongo.DESCENDING)])
db.testruns.ensure_index([("build.buildId", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating index on system-configurations...")
sys.stdout.flush()
db['system-configurations'].ensure_index([("configurationType", pymongo.ASCENDING), ("name", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

sys.stdout.write("Creating indexes on fs.chunks...")
sys.stdout.flush()
db.projects.ensure_index([("files_id", pymongo.ASCENDING), ("n", pymongo.ASCENDING)])
sys.stdout.write("Done.\n")
sys.stdout.flush()

print "Should be all done now."

