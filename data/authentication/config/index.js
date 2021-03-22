const spotifyOAuthConfig = require('./spotify_oauth_config');
const appleOAuthDetaills = require('./apple_oauth_config');

/**
 * Main configuration object for music streaming sites which use OAuth for user authentication
 */
const musicPlatformOauthConfig = {
    spotify: spotifyOAuthConfig,
    apple: appleOAuthDetaills
};

module.exports = musicPlatformOauthConfig;