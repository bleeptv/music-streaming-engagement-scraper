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

const client_id = process.env.SPOTIFY_CLIENT_ID // Your client id
const client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI; // Your redirect uri

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

app.get('/login', function (req, res, next) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-follow-read user-read-recently-played playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res, next) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {

        const access_token = body["access_token"];
        const refresh_token = body["refresh_token"];

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
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
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/spotify/engagement', async (req, res, next) => {
  // Get music engagmenent here

  const userId = req.query.userId;
  const auth_header = req.headers.authorization;
  const access_token = auth_header.substring(7, auth_header.length).trim();

  const userDetailsHolder = new UserDetailsHolder(access_token, userId);
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