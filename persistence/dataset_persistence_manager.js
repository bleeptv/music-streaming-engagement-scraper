const AdmZip = require("adm-zip"); 


class DatasetPersistenceManager {

    /**
     * 
     * @param {String} datasetPath The name of the folder where all datasets should be saved on S3/locally
     * @param {String} awsFileManager File Storage manager for object on AWS, in this case S3 
     */
    constructor(datasetPath, awsFileManager) {
        this.datasetPath = datasetPath;
        this.awsFileManager = awsFileManager;
    }

    /**
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
     * 
     * @returns 
     */
    zipDataSets() {

        const self = this;

        const zipInstance = new AdmZip(); 
        zipInstance.addLocalFolder(self.datasetPath);
        const zippedDataSetFolder = zipInstance.toBuffer();

        return {
            folderName: self.datasetFolderNameZip+".zip",
            zippedDatasets: zippedDataSetFolder
        }
    }
}

module.exports = DatasetPersistenceManager