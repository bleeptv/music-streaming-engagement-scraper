const spotifyOAuthScopes = 'user-read-private user-read-email user-follow-read user-read-recently-played playlist-read-private';

/**
 * Spotify OAuth configuration
 */
const spotifyOAuthConfig = {
    oauth_url: 'https://accounts.spotify.com/authorize?',
    api_token_url: 'https://accounts.spotify.com/api/token',
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scopes: spotifyOAuthScopes
};

module.exports = spotifyOAuthConfig;