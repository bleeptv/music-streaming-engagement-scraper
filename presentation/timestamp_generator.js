
/**
 * Generates a series timestamp objects
 */
class TimestampGenerator {

    /**
     * Generate a timestamp session object for a specific date
     * 
     * @param {Date} chosenDate 
     * @returns An object containing the business date and timestamp value for a specific date
     */
    generateSessionTimestampObject(chosenDate) {
        return {
            businessDate: chosenDate.toLocaleDateString('en-CA'),
            sessionTimeStamp: chosenDate.getTime()
        };
    }
}

module.exports = TimestampGenerator;