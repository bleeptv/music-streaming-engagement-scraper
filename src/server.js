/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
require('dotenv').config()

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

const folderNameZip = "spotify_datasets"
const folderPath = "datasets";
const SpotifyDatasetManager = require('../persistence/persistence_manager');
const dataManager = new SpotifyDatasetManager(folderNameZip, folderPath);
const MusicPlatformOAuthManager = require('../data/authentication/music_plaltform_oauth_manager');
const oAuthConfig = require('../data/authentication/config');
const musicPlatformOAuthManager = new MusicPlatformOAuthManager(oAuthConfig);

const client_id = process.env.SPOTIFY_CLIENT_ID // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret

const SpotifyApiClient = require('../data/api_client/spotify_client');
const apiClient = new SpotifyApiClient();
const MusicEngagementRepository = require("../data/repository/music_engagement_repository");
const musicEngagementRepo = new MusicEngagementRepository(apiClient);
const UserDetailsHolder = require('../data/entity/user_details_holder');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cors())
  .use(cookieParser());

app.get('/login?', function (req, res, next) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  const musicPlatform = req.query.platform;
  musicPlatformOAuthManager.startOAuthFlow(musicPlatform, state, res);

});

app.get('/callback', function (req, res, next) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  const platformName = req.query.platform;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);

    switch(platformName) {
      case "spotify":
        musicPlatformOAuthManager.completeSpotifyOAuthFlow(code, res);
        break;
    }
  }
});

app.get('/refresh_token', function (req, res, next) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var accessToken = body.access_token;
      res.send({
        'access_token': accessToken
      });
    }
  });
});

app.get('/spotify/engagement', async (req, res, next) => {
  // Get music engagmenent here

  const userId = req.query.userId;
  const auth_header = req.headers.authorization;
  const accessToken = auth_header.substring(7, auth_header.length).trim();

  const userDetailsHolder = new UserDetailsHolder(accessToken, userId);
  const musicEngagementResponse = await musicEngagementRepo.getUserMusicEngagement(userDetailsHolder);

  res.status(200)
    .json(musicEngagementResponse);

});

app.get("/general/datasets", (req, res, next) => {

  const {
    folderName,
    zippedDatasets
  } = dataManager.zipDataSets();

  res.set("Content-Type", "application/octet-stream");
  res.set("Content-Disposition", `attachment; filename=${folderName}`);
  res.set("Content-Length", zippedDatasets.length);
  res.send(zippedDatasets);

});

const portNumber = process.env.PORT || 8888;
app.listen(portNumber, () => {
  console.log('Listening on '+ portNumber);
});