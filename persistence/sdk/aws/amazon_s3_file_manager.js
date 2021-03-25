/**
 * A class to upload/retrieve files from an online storage (in this case Amazon S3)
 */
 class AmazonS3FileManager {

    /**
     * 
     * @param {AWS} AwsSDkInstance An instance of the AWS SDK
     */
    constructor(AwsSDkInstance) {
        this.s3BucketName = process.env.AWS_S3_BUCKET;
        this.s3 = new AwsSDkInstance.S3();
        this.defaultAccessControlList = 'public-read';
    }

    /**
     * 
     * @param {String} filename The name of the file to upload to S3 storage
     * @param {Object} fileContent The contents of the file to upload to S3. Currently an object, which is then coverted to
     * a ByteArray updloaded to the S3.
     */
    uploadFile = (filename, fileContent) => {
        const s3Params = {
            Bucket: this.s3BucketName,
            Key: filename,
            Body: fileContent,
            ACL: this.defaultAccessControlList
        };

        this.s3.upload(s3Params, (error, uploadResponse) => {
            if(error) throw error;
            console.log(`File uploaded successfully at ${uploadResponse.Location}`);
        });
    }

    getFolderContents = (folderName, onGetFolderContents) => {
        //TODO: Implement in Jira ticket #B2MVE-982
    }
}

module.exports = AmazonS3FileManager;
