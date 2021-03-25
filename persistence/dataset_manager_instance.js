const DatasetPersistenceManager = require('./dataset_persistence_manager');
const AmazonS3FileManager = require('./sdk/aws/amazon_s3_file_manager');
const awsSdkInstance = require('./sdk/aws/aws-instance');
const amazonS3FileManager = new AmazonS3FileManager(awsSdkInstance);
const folderPath = "datasets";

const dataManager = new DatasetPersistenceManager(folderPath, amazonS3FileManager);
module.exports = dataManager;