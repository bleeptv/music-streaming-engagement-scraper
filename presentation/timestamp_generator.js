
/**
 * Generates a timestamp in a string format
 */
class TimestampGenerator {

    /**
     * Generate a timestamp before the first hour selected current day
     * 
     * @returns The total milliseconds at the start of selected current day
     */
    getTimestampWithoutTime(currentDate) {
        currentDate.setHours(0, 0, 0, 0);
        return currentDate.getTime().toString();
    }
} 

module.exports = TimestampGenerator;