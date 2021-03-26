/**
 * Controls the persistence/retrieval of music engagement datasets
 */
class DatasetPersistenceManager {

    /**
     * 
     * @param {String} datasetPath The name of the folder where all datasets should be saved on S3/locally
     * @param {String} awsFileManager File Storage manager for object on AWS, in this case S3 
     */
    constructor(datasetPath, awsFileManager, localFileSystemManager) {
        this.datasetPath = datasetPath;
        this.awsFileManager = awsFileManager;
        this.localFileSystemManager = localFileSystemManager;
    }

    /**
     * Persist the dataset to storage
     * 
     * @param {String} folderName Folder to save the specific dataset to persist on the file manager
     * @param {String} filename Name of the file to persist
     * @param {Object} json The contents of the file to persist
     */
    saveFile(folderName, filename, json) {
        const filePath = `${this.datasetPath}/${folderName}/${filename}.json`;
        this.awsFileManager.uploadFile(filePath, JSON.stringify(json, null, 1));
    }

    /**
     * Retrieve a .zip file containing the desired folder in storage
     * 
     * @param {String} folderPath Filesystem location of the folder
     * @param {String} folderName Name of the folder to retrieve
     * @param {Callback} onComplete A callback to send over the zipped folder
     */
    retrieveZippedFolderAsync(folderPath, folderName, onComplete) {
        const self = this;

        self.awsFileManager.getFolderContentsAsync(folderName, async (folderContents) => {
            const folderSavingOps = folderContents.map(file => {
                return new Promise(resolve => {
                    self.localFileSystemManager.saveToFileSystemAsync(file.fileName, file.content, resolve);
                });
            });
        
            await Promise.all(folderSavingOps);
            onComplete(self.localFileSystemManager.zipFolder(folderPath, folderName));
        });
    }
}

module.exports = DatasetPersistenceManager