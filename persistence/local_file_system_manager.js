const fs = require("fs")
const AdmZip = require("adm-zip"); 

/**
 * Coordinates saving and compressing files and folders from the local file system
 */
class LocalFilesystemManager {

    /**
     * Save a file to the local filesystem asynchronously
     * 
     * @param {String} filePath Filesystem destination location to save the file
     * @param {*} contentBytesToSave Byte array of the file's contents
     * @param {Callback} onSaveCompleted Triggered to confirm that the file save operation was successful
     */
     saveToFileSystemAsync(filePath, contentBytesToSave, onSaveCompleted) {
        console.log("Saving file at path: ", filePath);

        this.createParentFolderIfUnavailable(filePath);
        
        fs.writeFile(filePath, contentBytesToSave, (err) => {
            if(err) {
                console.log("Error while saving file: ", err);
            } else {
                console.log("File saved at: ", filePath);
                onSaveCompleted();
            }
        });
    }

    /**
     * Create a parent folder for a file if it doens't exist
     * 
     * @param {String} filePath Filesystem destination location to save the file
     */
    createParentFolderIfUnavailable(filePath) {
        const folderBlocks = filePath.split("/");
        const totalNumberOfFolders = folderBlocks.length;

        if(totalNumberOfFolders > 0) {
            const parentFolder = folderBlocks.slice(0, totalNumberOfFolders - 1).join("/");
            if(!fs.existsSync(parentFolder)) {
                fs.mkdirSync(parentFolder, { recursive: true });
            }
        }
    }

    /**
     * Compress a folder into a file using the .zip format
     * 
     * @param {String} folderPath Filesystem source location of the folder to be compressed
     * @param {String} chosenFolderName The name to give to the generated zip file
     * @returns a .zip file containing the chosen folder
     */
    zipFolder(folderPath, chosenFolderName) {

        const zipInstance = new AdmZip(); 
        zipInstance.addLocalFolder(folderPath);
        const zippedDataSetFolder = zipInstance.toBuffer();

        return {
            folderName: chosenFolderName+".zip",
            zippedDatasets: zippedDataSetFolder
        }
    }
}

module.exports = LocalFilesystemManager;