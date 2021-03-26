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

    /**
     * 
     * @param {String} folderName 
     * @param {CallBack} onGetFolderContents 
     */
    getFolderContentsAsync = (folderName, onGetFolderContents) => {
        const self = this;

        const s3Params = {
            Bucket: this.s3BucketName,
            Prefix: folderName
        };

        this.s3.listObjectsV2(s3Params, async (error, folderData) => {
            if(error) throw error;

            const fileContentsRequests = folderData.Contents.map(s3Object => self.createRetrievalRequest(s3Object));
            const fileCollection = await Promise.all(fileContentsRequests);
            onGetFolderContents(fileCollection);
        });
    }

    /**
     * 
     * @param {*} s3Object 
     * @returns 
     */
    createRetrievalRequest(s3Object) {
        const self = this;
        const s3ObjectFileName = s3Object.Key;

        const fileParams = {
            Bucket: self.s3BucketName,
            Key: s3ObjectFileName
        };

        return new Promise(resolve => {
            this.s3.getObject(fileParams, (fileError, fileData) => {
                if(fileError) throw fileError;

                const fileObject = {
                    fileName: s3ObjectFileName,
                    content: fileData.Body.toString()
                };

                resolve(fileObject);
            });
        });
    }
}

module.exports = AmazonS3FileManager;
