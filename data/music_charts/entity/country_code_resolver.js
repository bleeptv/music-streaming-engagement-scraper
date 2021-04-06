const countryCodes = require('./country_codes');

/**
 * Selects the appropriate country code based on the name
 */
class CountryCodeResolver {

    /**
     * 
     * @param {String} countryName The name of the country to get a country code
     * @param {Boolean} useGlobalIfMissing If set to true, the default GLOBAL value is used when the country name 
     * is not found by the country codes resolver
     * @returns a string representing the country code for an available country name
     */
    getCountryCode(countryName = countryCodes.GLOBAL, useGlobalIfMissing = false) {
        const countryNameWithUnderscores = countryName.replace(/ /g, "_",).trim();
        const upperCasedCountryName = countryNameWithUnderscores.toUpperCase();

        if(upperCasedCountryName in countryCodes) {
            return countryCodes[upperCasedCountryName];
        }
        
        if(useGlobalIfMissing) {
            return this.DEFAULT_COUNTRY_CODE;
        }

        const invalidCountryCodeErrorMessage = `Missing country name \"${countryName}\" in collection. Either select a valid country name or set "useGlobalIfMissing" to true to return the default country code`
        throw Error(invalidCountryCodeErrorMessage);
    }
}

module.exports = CountryCodeResolver;

