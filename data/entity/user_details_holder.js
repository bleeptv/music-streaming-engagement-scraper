const crypto = require('crypto');

/**
 * Hold user specific data to perform music engagement network requests and data persistence operations 
 */
class UserDetailsHolder {

    /**
     * Initialize new instance of User details holder
     * @param {String} accessToken 
     * @param {String} userId 
     */
    constructor(accessToken, userId){
        this.accessToken = accessToken;
        this.userId = userId;
        this.hashedUserId = crypto.createHash('md5').update(userId).digest('hex');
    }
}

module.exports = UserDetailsHolder;