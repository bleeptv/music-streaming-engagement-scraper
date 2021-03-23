const appleOAuthScopes = 'name email';

/**
 * Apple OAuth configuration
 */
const appleOAuthConfig = {
    oauth_url: 'https://appleid.apple.com/auth/authorize?',
    api_token_url: 'https://appleid.apple.com/auth/token',
    response_type: 'code',
    response_mode: 'form_post',
    client_id: process.env.APPLE_CLIENT_ID, // To be added in Jira Ticket B2MVE-944
    client_secret: "", // To be generated in Jira Ticket B2MVE-944
    redirect_uri: process.env.APPLE_REDIRECT_URI,
    scopes: appleOAuthScopes
}

module.exports = appleOAuthConfig;