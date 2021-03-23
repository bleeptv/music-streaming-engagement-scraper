const PlaylistType = require('../entity/playlist_type');  
const UserDetailsHolder = require('../entity/user_details_holder');
const OBJECT_TRUNCATE_LIMIT = 0;
const TimestampGenerator = require('../../presentation/timestamp_generator');
const timestampGenerator = new TimestampGenerator();

/**
 * 
 */
class MusicEngagementRepository {

    constructor(spotifyApiClient) {
        this.spotifyApiClient = spotifyApiClient;
    }

    /**
     * 
     * @param {Object} objCollection 
     * @param {Number} truncateLimit 
     * @returns 
     */
    generateTallyObject(objCollection, truncateLimit=0) {

        const self = this;

        const tallyReduceFunction = (obj, num) => {
            obj[num] = (++obj[num] || 1);
            return obj;
        }

        const rawTallyObject = {}
        objCollection.reduce(tallyReduceFunction, rawTallyObject);
        const sortedTallyObject = Object.entries(rawTallyObject)
            .sort(([,v1], [,v2]) => +v2 - +v1)
            .reduce((r, [k, v]) => Object.assign(r, { [k]: v }), {});
    
        return self.truncateObject(sortedTallyObject, truncateLimit);
    }

    truncateObject(obj, truncateLimit) {
        const objectSize = Object.keys(obj).length;
        const endIndex = truncateLimit == 0 ? objectSize : Math.min(truncateLimit, objectSize);
        const sliced = Object.keys(obj).slice(0, endIndex).reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});

        return sliced;
    }
    
    /**
     * 
     * @param {UserDetailsHolder} userDetailsHolder 
     */
    async getUserMusicEngagement(userDetailsHolder) {
        const self = this;
        const timeStampObject = timestampGenerator.generateSessionTimestampObject(new Date());
    
        // Get number of playlists created
        const breadthOfMusicEngagement = new Promise(resolve => {
            self.getBreadthOfEngagement(userDetailsHolder, timeStampObject, resolve);
        });
    
        // Get recently played tracks for songs in heavy rotation, as well as regular engagement
        const depthOfMusicEngagment = new Promise(resolve => {
            self.getDepthOfMusicEngagement(userDetailsHolder, timeStampObject, resolve);
        });
    
        // Get Following for all artists
        const followingEngagmentDetails = new Promise(resolve => {
            self.getFollowingEngagmentDetails(userDetailsHolder, timeStampObject, resolve);
        });
    
        const [breadthResult, depthResult, followingResult] = await Promise.all([breadthOfMusicEngagement, depthOfMusicEngagment, followingEngagmentDetails]);

        const playlistInfo = {
            total_playlist_count: breadthResult.total_playlists_count,
            total_created_playlist_count: breadthResult.total_created_playlist_count,
            total_saved_playlist_count: breadthResult.total_saved_playlist_count,
            total_playlist_followers_count: breadthResult.total_playlist_followers,
            total_tracks_count: breadthResult.total_tracks_count
        };

        const musicTasteInfo = {
            total_genres_general: breadthResult.total_genres_in_library,
            total_genres_recently: depthResult.total_genres_played_recently,
            top_general_music_genres: breadthResult.general_most_played_genres,
            top_recent_music_genres: depthResult.most_played_genres,
            top_recently_played: depthResult.recent_most_played_tracks
        }

        return {
            playlist_stats: playlistInfo,
            music_taste_stats: musicTasteInfo,
            total_artist_follow_count: followingResult.total_artists_followed,
            artist_follow_average_popularity: Number((followingResult.average_artist_popularity).toFixed(0)),
          };
    }
    
    /**
     * 
     * @param {UserDetailsHolder} userDetailsHolder 
     * @param {Object} timeStampObject 
     * @param {*} onRequestCompleted 
     */
    getBreadthOfEngagement(userDetailsHolder, timeStampObject, onRequestCompleted) {
        const self = this;
    
        this.spotifyApiClient.getCurrentUsersPlaylists(userDetailsHolder, timeStampObject, async (error, playlistCollectionResult) => {

            if(error) throw error;
            
            const musicEngagementBreadthResult = {};
            musicEngagementBreadthResult["total_playlists_count"] = playlistCollectionResult.totalPlaylistCount;
            musicEngagementBreadthResult["total_tracks_count"] = playlistCollectionResult.totalTracksCount;
            musicEngagementBreadthResult["total_created_playlist_count"] = playlistCollectionResult.totalCreatedPlaylistCount;
            musicEngagementBreadthResult["total_saved_playlist_count"] = playlistCollectionResult.totalSavedPlaylistCount;

            const artistIds = new Set();
            const tracksRequests = [];
            const playlistFollowingsRequests = [];
            let totalPlaylistFollowersCount = 0;
    
            playlistCollectionResult.playlistIds.forEach((playlistId) => {
                const tracksFetchRequest = new Promise((resolve) => {
                    this.spotifyApiClient.getTracksFromPlaylist(userDetailsHolder, timeStampObject, playlistId, (error, playlistTracksResult) => {

                        if(error) {
                            resolve(error);
                        } else {
                            playlistTracksResult.forEach((track) => {
                                track["artistDetailsCollection"].forEach(artist => {
                                    artistIds.add(artist["id"]);
                                });
                            });
        
                            resolve();
                        }                        
                    });
                });
    
                tracksRequests.push(tracksFetchRequest);
    
                const playlistDetailFetchRequests = new Promise((resolve) => {
                    this.spotifyApiClient.getFollowersForPlaylistId(userDetailsHolder, playlistId, (error, followersCount) => {
                        if(error) {
                            resolve(error);   
                        } else {
                            totalPlaylistFollowersCount += followersCount;
                            resolve();
                        }
                    });
                });
    
                playlistFollowingsRequests.push(playlistDetailFetchRequests);
                
            });
    
            // Get first 50 music tracks in each playlist
            await Promise.all(tracksRequests.concat(playlistFollowingsRequests));

            musicEngagementBreadthResult["total_playlist_followers"] = totalPlaylistFollowersCount;

            self.getArtistProfiles(userDetailsHolder, timeStampObject, artistIds, PlaylistType.ALL, (error, genresTally) => {

                if(error) throw error

                musicEngagementBreadthResult["total_genres_in_library"] = Object.keys(genresTally).length;
                musicEngagementBreadthResult["general_most_played_genres"] = genresTally;
                onRequestCompleted(musicEngagementBreadthResult);
            });
    
        });
    }
    
    /**
     * 
     * @param {UserDetailsHolder} userDetailsHolder 
     * @param {Object} timeStampObject 
     * @param {*} onRequestCompleted 
     */
    getDepthOfMusicEngagement(userDetailsHolder, timeStampObject, onRequestCompleted) {
        const self = this;
    
        this.spotifyApiClient.getMostRecentTracks(userDetailsHolder, timeStampObject, (error, totalRecentTracksDetails) => {

            if(error) throw error;
            
            const recentlyPlayedTrackNames = []
            const artistIds = new Set();
    
            totalRecentTracksDetails.forEach((track) => {
                recentlyPlayedTrackNames.push(track["trackName"]);
                track["artistDetailsCollection"].forEach(artist => {
                    artistIds.add(artist["id"]);
                });
            });
    
            // Check for tracks on repeat
            const musicEngagementDepthResult = {}
            const mostPlayedSongs = self.generateTallyObject(recentlyPlayedTrackNames);
            musicEngagementDepthResult["recent_most_played_tracks"] = self.truncateObject(mostPlayedSongs, OBJECT_TRUNCATE_LIMIT);
    
            self.getArtistProfiles(userDetailsHolder, timeStampObject, artistIds, PlaylistType.RECENTLY_PLAYED, (error, genresTally) => {

                if(error) throw error;

                musicEngagementDepthResult["most_played_genres"] = genresTally;
                musicEngagementDepthResult["total_genres_played_recently"] = Object.keys(genresTally).length;
                onRequestCompleted(musicEngagementDepthResult);
            });
        });
    };
    
    /**
     * 
     * @param {UserDetailsHolder} userDetailsHolder 
     * @param {Object} timeStampObject 
     * @param {Set} artistIds 
     * @param {PlaylistType} playlistTypeValue 
     * @param {*} onComplete 
     */
    getArtistProfiles(userDetailsHolder, timeStampObject, artistIds, playlistTypeValue, onComplete){
        const self = this;
        const artistIdsArray = Array.from(artistIds);
        const trimmedArtistsIds = artistIdsArray.length > 50 ? artistIdsArray.slice(0, 50) : artistIdsArray;
        
        // Get the music genres I'm into regularly (artists, genres)
        this.spotifyApiClient.getMusicGenresPerArtist(userDetailsHolder, timeStampObject, trimmedArtistsIds.join(","), (error, musicGenres) => {    
            // Get genres I play the most
            if(error) return onComplete(error, null);

            const mostPlayedMusicGenresTally = self.generateTallyObject(musicGenres, OBJECT_TRUNCATE_LIMIT);
            onComplete(null, mostPlayedMusicGenresTally);
        }, playlistTypeValue);
    }
    
    /**
     * 
     * @param {UserDetailsHolder} userDetailsHolder 
     * @param {Object} timeStampObject 
     * @param {*} onRequestComplete 
     */
    getFollowingEngagmentDetails(userDetailsHolder, timeStampObject, onRequestComplete) {
        this.spotifyApiClient.getFollowedArtists(userDetailsHolder, timeStampObject, (error, followedArtistsCollection) => {

            if(error) throw error;
            
            let totalPopularity = 0;
            const totalArtists = followedArtistsCollection.length;
    
            followedArtistsCollection.forEach(artist => {
                totalPopularity += artist.popularity;
            });

            const followingEngagementResult = {
                average_artist_popularity: (totalPopularity / totalArtists),
                total_artists_followed: totalArtists
            };

            onRequestComplete(followingEngagementResult);
        });
    }
}

module.exports = MusicEngagementRepository;