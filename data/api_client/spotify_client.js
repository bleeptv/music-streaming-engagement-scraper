const request = require('request'); // "Request" library
const endpointUrl = "https://api.spotify.com/v1";
const SpotifyDatasetManager = require('../../persistence/persistence_manager');
const folderNameZip = "datasets";
const folderPath = "datasets";
const TimestampGenerator = require('../../presentation/timestamp_generator');
const timestampGenerator = new TimestampGenerator();
const dataManager = new SpotifyDatasetManager(folderNameZip, folderPath);

class SpotifyApiClient {

  constructor() {
    this.currentDateTimestamp = timestampGenerator.getTimestampWithoutTime(new Date()); 
    this.DEFAULT_MARKET = "ES";
    this.userIdLenghtLimit = 4; //Arbitrarily chosen number of characters in a user id
  }

  /**
   * 
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {*} onComplete 
   */
  getCurrentUsersPlaylists(userDetailsHolder, onComplete) {

    const self = this;
    const truncatedUserId = self.truncateUserId(userDetailsHolder.userId, self.userIdLenghtLimit);

    let totalTracksCount = 0;

    var options = {
      url: `${endpointUrl}/me/playlists?limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, (error, response, body) => {

      if (error) {
        onComplete(error, null);
      } else {
        const playlists = body["items"];

        const createdPlaylists = [];
        const savedPlaylists = [];
        const playlistIds = new Set();

        if(playlists !== null && playlists.length > 0) {
          playlists.forEach(playlist => {
            if(playlist["owner"]["id"] === userDetailsHolder.userId) {
              createdPlaylists.push(playlist);
            } else {
              savedPlaylists.push(playlist);
            }
  
            playlistIds.add(playlist["id"]);
            totalTracksCount += playlist["tracks"]["total"];
          });

          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}/playlists` , "created", createdPlaylists);
          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}/playlists` , "saved", savedPlaylists);
        }

        const playlistResult = {
          totalCreatedPlaylistCount: createdPlaylists.length,
          totalSavedPlaylistCount: savedPlaylists.length,
          totalPlaylistCount: playlists.length,
          totalTracksCount,
          playlistIds
        };

        onComplete(null, playlistResult);
      }
    });
  }

  /**
   * 
   * @param {*} playlistId 
   * @param {*} onComplete 
   */
  getTracksFromPlaylist(userDetailsHolder, playlistId, onComplete) {
    const self = this;
    const truncatedUserId = self.truncateUserId(userDetailsHolder.userId, self.userIdLenghtLimit);

    var options = {
      url: `${endpointUrl}/playlists/${playlistId}/tracks?market=${this.DEFAULT_MARKET}&limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      if (error) {
        onComplete(error, null);
      } else {
        const musicTracks = body["items"] !== null ? body["items"] : [];

        if(musicTracks.length > 0) {
          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}`, `playlist_${playlistId}_tracks`, body);
        }

        onComplete(null, self.extractMusicTrackDetails(musicTracks));
      }

    });
  }

  /**
   * Get the 50 music tracks from the current user's history
   * 
   * @param onComplete Callback to return the total of the tracks played within a specific time frame. Defaults to a max of 50 tracks
   */
  getMostRecentTracks(userDetailsHolder, onComplete) {
    const self = this;
    const truncatedUserId = self.truncateUserId(userDetailsHolder.userId, self.userIdLenghtLimit);

    var options = {
      url: `${endpointUrl}/me/player/recently-played?limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      if(error) {
        onComplete(error, null);
      } else {
        const musicTracks = body["items"] !== null ? body["items"] : [];
        if(musicTracks.length > 0) {
          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}` , "recently_played_tracks", body);
        }
        onComplete(null, self.extractMusicTrackDetails(musicTracks));
      }
    });
  }

  /**
   * Get the genres based on the list of music artist IDs passed in
   * 
   * @param {*} musicArtistIds 
   * @param {*} onComplete 
   */
  getMusicGenresPerArtist(userDetailsHolder, musicArtistIdsString, onComplete, playlistType = "") {
    const self = this;
    const truncatedUserId = self.truncateUserId(userDetailsHolder.userId, self.userIdLenghtLimit);
    const genreCollection = [];

    if(musicArtistIdsString.length == 0) {
      onComplete(null, genreCollection);
      return;
    }

    var options = {
      url: `${endpointUrl}/artists?ids=${encodeURIComponent(musicArtistIdsString)}`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      if(error) {
        onComplete(error, null);
      } else {
        const artistsResult = body["artists"];

        if(artistsResult !== null && artistsResult.length > 0) {
          artistsResult.forEach(artist => {
            artist["genres"].forEach(genre => {
              genreCollection.push(genre);
            })
          });
          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}` , `artists_${playlistType}`, body);
        }
      
        onComplete(null, genreCollection);
        
      }
    });

  }

  /**
   * 
   * @param {*} playlistId 
   * @param {*} onCompleted 
   */
  getFollowersForPlaylistId(userDetailsHolder, playlistId, onComplete) {
    var options = {
      url: `${endpointUrl}/playlists/${playlistId}`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      if(error) {
        onComplete(error, null);
      } else {
        const followers = body["followers"] !== null ? body["followers"]["total"] : [];
        onComplete(null, followers);
      }
    });
  }

  /**
   * Get the artists followed by the current user
   * 
   * @param onComplete Callback to pass over the result of the followed artists query
   */
  getFollowedArtists(userDetailsHolder, onComplete) {
    const self = this;
    const truncatedUserId = self.truncateUserId(userDetailsHolder.userId, self.userIdLenghtLimit);

    const artistDataCollection = [];

    var options = {
      url: `${endpointUrl}/me/following?type=artist&limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.access_token
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      if(error) {
        onComplete(error, null);
      } else {

        const followedArtistsResult = body["artists"];

        if(followedArtistsResult !== null && followedArtistsResult["items"].length > 0) {
          const followedArtists = body["artists"]["items"];

          followedArtists.forEach(artist => {
            const artistDetails = {
              name: artist["name"],
              followers: artist["followers"]["total"],
              popularity: artist["popularity"],
            };

            artistDataCollection.push(artistDetails);
          });

          dataManager.saveFile(`spotify/${self.currentDateTimestamp}/${truncatedUserId}` , "followed_artists", body);
        }
        
        onComplete(null, artistDataCollection);
      }
    });
  }

  /**
   * Extract the music tracks contained in a collection of music tracks. This can come from either a playlist or a JSON result
   * from the Spotify result to get tracks recently played.
   * 
   * @param musicTrackItems An array of music track items acquired from a playlist or a REST API query
   * @returns A collection of music track details which includes the track name and details on the artists for the music track
   */
  extractMusicTrackDetails(musicTrackItems) {

    const extractedMusicTracks = []

    musicTrackItems.forEach(musicTrack => {
      const trackName = musicTrack["track"]["name"];
      const artistDetailsCollection = []

      musicTrack["track"]["artists"].forEach(artist => {
        const artistDetails = {
          name: artist["name"],
          id: artist["id"]
        };

        artistDetailsCollection.push(artistDetails);
      });

      const trackInformation = {
        trackName,
        artistDetailsCollection
      };

      extractedMusicTracks.push(trackInformation)
    });

    return extractedMusicTracks;
  }

  truncateUserId(userId, truncationLimit) {
    const limit = Math.min(userId.length, truncationLimit);
    return userId.substring(userId.length - limit, userId.length);
  }
}

module.exports = SpotifyApiClient