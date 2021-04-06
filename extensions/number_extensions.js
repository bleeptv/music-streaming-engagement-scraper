/**
 * Checks if a number is within a range
 * 
 * @param {Number} lowerBound The lower bound in the number range to check 
 * @param {Number} upperBound The upper bound (ceiling) in the number range to check
 * @returns True if the number is within the range, false otherwise 
 */
Number.prototype.inRange = function(lowerBound, upperBound) {
    return this >= lowerBound && this <= upperBound;
}