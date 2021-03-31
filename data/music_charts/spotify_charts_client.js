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

        const timeframeDate = this.generateTimeFrameDate(chartsDate, timeframe);
        const top200sUrl = `https://spotifycharts.com/regional/${regionCode}/${timeframe}/${timeframeDate}/download`;
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

        const timeframeDate = this.generateTimeFrameDate(chartsDate, timeframe);
        const viral50Url = `https://spotifycharts.com/viral/${regionCode}/${timeframe}/${timeframeDate}/download`;
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

        const options = {
            url: chartsUrl,
            json: false
        }

        self.httpClient.get(options, async (error, response, body) => {
            if(error) throw error;

            console.log(response.statusCode)
            if(response.statusCode !== 200) return resultCallback(null);
            resultCallback(await self.csvToJsonConverter.fromString(body));
        });
    }

    /**
     * 
     * @param {String} chosenDate 
     * @param {String} timeframe
     * @returns 
     */
    generateTimeFrameDate = (chosenDate, timeframe) => {
        if(chosenDate === "latest" || timeframe === SpotifyChartTimeFrame.DAILY) return chosenDate
        
        return `${chosenDate}--${chosenDate}`
    }
}

const client = new SpotifyChartsClient(require('request'));
client.getTop200Async((result) => {
        console.log(result);
    },
    timeframe = SpotifyChartTimeFrame.WEEKLY,
    regionCode = "za",
    chartsDate = "2021-03-12"
)

module.exports = SpotifyChartsClient;