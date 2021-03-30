const csvToJson = require('csvtojson');
const SpotifyChartTimeFrame = require('./entity/spotify_chart_timeframe');

/**
 * Fetches the top 200 (regional) or viral 50 (popular) songs on Spotify based on locale, date, and time frame
 */
class SpotifyChartsClient {

    constructor(httpClient) {
        this.httpClient = httpClient;
        this.csvToJsonConverter = csvToJson({noheader: true});
    }
    
    /**
     * Get the top 200 music tracks in a region
     * 
     * @param {Callback} resultCallback Triggered with an object containing the top 200 songs on Spotify
     * @param {String} timeframe The time frame to get the results in. Can be either DAILY or WEEKLY
     * @param {String} regionCode Narrow down the chart results to a specific geographic location (i.e. za = South Africa, uk = United Kingdom)
     * defaults to "global"
     * @param {String} chartsDate Date string formatted to YYYY-MM-DD. Defaults to "latest"
     */
    getTop200Async = (
        resultCallback,
        timeframe = SpotifyChartTimeFrame.DAILY,
        regionCode = "global", 
        chartsDate = "latest"
    ) => {

        this.checkTimeFrame(timeframe);
        const top200sUrl = `https://spotifycharts.com/regional/${regionCode}/${timeframe}/${chartsDate}/download`;
        this.getChartsData(top200sUrl, resultCallback);
    }

    /**
     * Get the most popular 50 music tracks in a region
     * 
     * @param {Callback} resultCallback Triggered with an object containing the viral/poppular 50 songs on Spotify
     * @param {String} timeframe The time frame to get the results in. Can be either DAILY or WEEKLY. Defaults to DAILY
     * @param {String} regionCode Narrow down the chart results to a specific geographic location (i.e. za = South Africa, uk = United Kingdom)
     * defaults to "global"
     * @param {String} chartsDate Date string formatted to YYYY-MM-DD. Defaults to "latest"
     */
    getViral50Async = (
        resultCallback,
        timeframe = SpotifyChartTimeFrame.DAILY,
        regionCode = "global", 
        chartsDate = "latest"
    ) => {

        this.checkTimeFrame(timeframe);
        const viral50Url = `https://spotifycharts.com/viral/${regionCode}/${timeframe}/${chartsDate}/download`;
        this.getChartsData(viral50Url, resultCallback);
    }

    /**
     * Make an network request to fetch charts data from the Spotify Charts API
     * 
     * @param {String} chartsUrl The URL pointing to a specific type of chart targeted to a region, date, and time frame
     * @param {Callback} resultCallback Callback triggered when data has been fetched from the Spotify Charts API
     */
    getChartsData = (chartsUrl, resultCallback) => {
        const self = this;

        self.httpClient.get(chartsUrl, async (error, response, body) => {
            if(error) throw error;
            
            if(body === undefined) return resultCallback(null);

            resultCallback(await self.csvToJsonConverter.fromString(body));
        });
    }

    /**
     * Perform a check on the time frame variable to make sure it's 1 of 2 options: DAILY or WEEKLY
     * 
     * @param {String} timeframe 
     */
    checkTimeFrame = (timeframe) => {
        if(timeframe !== SpotifyChartTimeFrame.DAILY || timeframe !== SpotifyChartTimeFrame.WEEKLY) {
            throw Error("Invalid Timeframe selected")
        }
    }
}

module.exports = SpotifyChartsClient;