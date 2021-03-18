const fs = require("fs")
const AdmZip = require("adm-zip"); 


class SpotifyDatasetManager {

    constructor(datasetFolderNameZip, datasetPath) {
        this.datasetPath = datasetPath;
        this.datasetFolderNameZip = datasetFolderNameZip;

        if(!fs.existsSync(datasetPath)) {
            fs.mkdirSync(datasetPath);
        }
    }

    /**
     * 
     * @param {*} username 
     * @param {*} filename 
     * @param {*} json 
     */
    saveFile(folderName, filename, json) {

        const filePath = this.datasetPath+"/"+folderName;
        if(!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }

        fs.writeFile(filePath+"/"+filename+".json", JSON.stringify(json, null, 1), (err) => {
            if(err) {
                console.log("Error while saving file: ", err);
            } else {
                console.log("File saved at: ", filePath);
            }
        });
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

module.exports = SpotifyDatasetManager