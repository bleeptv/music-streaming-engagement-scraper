const request = require('request'); // "Request" library
const endpointUrl = "https://api.spotify.com/v1";

class SpotifyApiClient {

  constructor(datasetManager) {
    this.datasetManager = datasetManager;
    this.DEFAULT_MARKET = "ES";
    this.playlistBatchLimit = process.env.PLAYLIST_BATCH_LIMIT;
  }

  /**
   * 
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {Object} timestampObject 
   * @param {*} onComplete 
   */
  getCurrentUsersPlaylists(userDetailsHolder, timestampObject, onComplete) {

    const self = this;
    let totalTracksCount = 0;

    var options = {
      url: `${endpointUrl}/me/playlists?limit=${this.playlistBatchLimit}`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, (error, response, body) => {

      console.log("Response code for fetching current user's playlists: ", response.statusCode);

      if (error) {
        onComplete(error, null);
      } else {
        const playlists = body["items"];

        const createdPlaylists = [];
        const savedPlaylists = [];
        const playlistIds = new Set();

        if(playlists !== undefined && playlists.length > 0) {
          playlists.forEach(playlist => {
            if(playlist["owner"]["id"] === userDetailsHolder.userId) {
              createdPlaylists.push(playlist);
            } else {
              savedPlaylists.push(playlist);
            }
  
            playlistIds.add(playlist["id"]);
            totalTracksCount += playlist["tracks"]["total"];
          });

          self.datasetManager.saveFile(`spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}/playlists` , `${timestampObject.sessionTimeStamp}_created`, createdPlaylists);
          self.datasetManager.saveFile(`spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}/playlists` , `${timestampObject.sessionTimeStamp}_saved`, savedPlaylists);
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
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {Object} timestampObject 
   * @param {String} playlistId 
   * @param {*} onComplete 
   */
  getTracksFromPlaylist(userDetailsHolder, timestampObject, playlistId, onComplete) {
    const self = this;

    var options = {
      url: `${endpointUrl}/playlists/${playlistId}/tracks?market=${this.DEFAULT_MARKET}&limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      console.log("Response code for fetching music tracks from all playlists: ", response.statusCode);

      if (error) {
        onComplete(error, null);
      } else {
        const musicTracks = body["items"] !== undefined ? body["items"] : [];

        if(musicTracks.length > 0) {
          self.datasetManager.saveFile(
            `spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}`, 
            `${timestampObject.sessionTimeStamp}_playlist_${playlistId}_tracks`, 
            body);
        }

        onComplete(null, self.extractMusicTrackDetails(musicTracks));
      }

    });
  }

  /**
   * Get the 50 music tracks from the current user's history
   * 
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {Object} timestampObject 
   * @param {*} onComplete Callback to return the total of the tracks played within a specific time frame. Defaults to a max of 50 tracks
   */
  getMostRecentTracks(userDetailsHolder, timestampObject, onComplete) {
    const self = this;

    var options = {
      url: `${endpointUrl}/me/player/recently-played?limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      console.log("Response code for fetching most recently played tracks: ", response.statusCode);

      if(error) {
        onComplete(error, null);
      } else {
        const musicTracks = body["items"] !== undefined ? body["items"] : [];
        if(musicTracks.length > 0) {
          self.datasetManager.saveFile(
            `spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}` , 
            `${timestampObject.sessionTimeStamp}_recently_played_tracks`, 
            body);
        }
        onComplete(null, self.extractMusicTrackDetails(musicTracks));
      }
    });
  }

  /**
   * 
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {Object} timestampObject 
   * @param {String} musicArtistIdsString 
   * @param {*} onComplete 
   * @param {PlaylistType} playlistType 
   * @returns 
   */
  getMusicGenresPerArtist(userDetailsHolder, timestampObject, musicArtistIdsString, onComplete, playlistType = "") {
    const self = this;
    const genreCollection = [];

    if(musicArtistIdsString.length == 0) {
      onComplete(null, genreCollection);
      return;
    }

    var options = {
      url: `${endpointUrl}/artists?ids=${encodeURIComponent(musicArtistIdsString)}`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      console.log("Response code for fetching artists: ", response.statusCode);
      if(error) {
        onComplete(error, null);
      } else {
        const artistsResult = body["artists"];

        if(artistsResult !== undefined && artistsResult.length > 0) {
          artistsResult.forEach(artist => {
            artist["genres"].forEach(genre => {
              genreCollection.push(genre);
            })
          });
          self.datasetManager.saveFile(
            `spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}` , 
            `${timestampObject.sessionTimeStamp}_artists_${playlistType}`, 
            body);
        } else {
          console.log("No artists found from query");
        }
      
        console.log("Total genres in collection: ", genreCollection.length);
        onComplete(null, genreCollection);
      }
    });

  }

  /**
   * 
   * @param {UserDetailsHolder} userDetailsHolder
   * @param {String} playlistId 
   * @param {*} onComplete 
   */
  getFollowersForPlaylistId(userDetailsHolder, playlistId, onComplete) {
    var options = {
      url: `${endpointUrl}/playlists/${playlistId}`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      console.log("Response code for fetching playlist followers count: ", response.statusCode);

      if(error) {
        onComplete(error, null);
      } else {
        const followers = body["followers"] !== undefined ? body["followers"]["total"] : [];
        onComplete(null, followers);
      }
    });
  }

  
  /**
   * Get the artists followed by the current user
   * 
   * @param {UserDetailsHolder} userDetailsHolder 
   * @param {Object} timestampObject 
   * @param {*} onComplete Callback to pass over the result of the followed artists query
   */
  getFollowedArtists(userDetailsHolder, timestampObject, onComplete) {
    const self = this;
    const artistDataCollection = [];

    var options = {
      url: `${endpointUrl}/me/following?type=artist&limit=50`,
      headers: {
        'Authorization': 'Bearer ' + userDetailsHolder.accessToken
      },
      json: true
    };

    request.get(options, function (error, response, body) {

      console.log("Response code for fetching followed artists: ", response.statusCode);

      if(error) {
        onComplete(error, null);
      } else {

        const followedArtistsResult = body["artists"];

        if(followedArtistsResult !== undefined && followedArtistsResult["items"].length > 0) {
          const followedArtists = body["artists"]["items"];

          followedArtists.forEach(artist => {
            const artistDetails = {
              name: artist["name"],
              followers: artist["followers"]["total"],
              popularity: artist["popularity"],
            };

            artistDataCollection.push(artistDetails);
          });

          self.datasetManager.saveFile(
            `spotify/${timestampObject.businessDate}/${userDetailsHolder.hashedUserId}` , 
            `${timestampObject.sessionTimeStamp}_followed_artists`, body);
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
}

module.exports = SpotifyApiClient