const AWS = require('aws-sdk');
const AWSConfig = {
    apiVersion: process.env.AWS_API_VERSION,
    accessKeyId: process.env.AWS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_REGION
};

AWS.config.update(AWSConfig);

module.exports = AWS;