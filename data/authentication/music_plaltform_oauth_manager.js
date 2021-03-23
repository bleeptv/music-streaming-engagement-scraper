const querystring = require('querystring');
const request = require('request');

/**
 * Performs the OAuth authentication flow for various music streaming platforms such as Apple and Spotify
 */
class MusicPlatformOAuthManager {

    /**
     * Main OAuth configuration object for all music streaming platforms available on the application
     * 
     * @param {Object} oAuthConfig 
     */
    constructor(oAuthConfig) {
        this.oAuthConfig = oAuthConfig;
    }

    /**
     * Starts the authentcation flow for a particular music platform
     * 
     * @param {String} platformName Music streaming platform name to start the authentication flow for
     * @param {String} sessionStateValue A randomly generated string value used to denote a user session when they log in
     * @param {Response} serverResponse The server response object from the login endpoint to redirect to the music platform's OAuth URL
     * @returns 
     */
    startOAuthFlow = (platformName, sessionStateValue, serverResponse) => {
        const currentPlatformConfig = this.oAuthConfig[platformName];

        if(platformName === "" || currentPlatformConfig === undefined) {
            console.log("Invalid music platform: ", platformName);
            response.redirect('/' + querystring.stringify({
                error: 'invalid_music_platform'
            }));
            return;
        }
        
        const oauthQueryString = {
            response_type: currentPlatformConfig.response_type,
            client_id: currentPlatformConfig.client_id,
            scope: currentPlatformConfig.scopes,
            redirect_uri: currentPlatformConfig.redirect_uri,
            state: sessionStateValue
        };

        if(platformName === "apple") {
            oauthQueryString["response_mode"] = currentPlatformConfig.response_mode;
        }

        serverResponse.redirect(currentPlatformConfig.oauth_url + querystring.stringify(oauthQueryString));
    }

    /**
     * Completes the OAuth authentication flow for Spotify
     * 
     * @param {String} authCode Authencation code received after a user successfully logs into Spotify
     * @param {Response} serverResponse The server response object from the callback endpoint to redirect to the web app's URL
     */
    completeSpotifyOAuthFlow = (authCode, serverResponse) => {
        const currentPlatformConfig = this.oAuthConfig["spotify"];

        var authOptions = {
            url: currentPlatformConfig.api_token_url,
            form: {
              code: authCode,
              redirect_uri: currentPlatformConfig.redirect_uri,
              grant_type: 'authorization_code'
            },
            headers: {
              'Authorization': 'Basic ' + (new Buffer(currentPlatformConfig.client_id + ':' + currentPlatformConfig.client_secret).toString('base64'))
            },
            json: true
          };
      
          request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
      
              const access_token = body["access_token"];
              const refresh_token = body["refresh_token"];
      
              // we can also pass the token to the browser to make requests from there
              serverResponse.redirect('/#' +
                querystring.stringify({
                  access_token: access_token,
                  refresh_token: refresh_token
                }));
            } else {
                serverResponse.redirect('/' +
                querystring.stringify({
                  error: 'invalid_token'
                }));
            }
          });
    };
}

module.exports = MusicPlatformOAuthManager;