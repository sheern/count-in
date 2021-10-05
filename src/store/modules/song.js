const state = {
    songUri: '',
    // TODO this catalog info is available in the WebPlaybackState of the client-side player.
    // Instead of hitting the web API for this, we can just use the client-side state
    songCatalogInfo: null,
    songAnalysis: null,
}

const getters = {
    // Extract the Spotify song id (everything past the last :)
    songId(state) {
        return state.songUri.split(':').at(-1)
    },
    isSongCatalogInfoLoaded(state) {
        return !!state.songCatalogInfo &&
            state.songUri === state.songCatalogInfo.songUri
    },
    isSongAnalysisLoaded(state) {
        return !!state.songAnalysis &&
            state.songUri === state.songAnalysis.songUri
    },
}

const mutations = {
    setSongUri(state, { songUri }) {
        state.songUri = songUri
    },
    setSongCatalogInfo(state, { songUri, name, imageUrl, artist }) {
        state.songCatalogInfo = {
            songUri,
            name,
            imageUrl,
            artist,
        }
    },
    setSongAnalysis(state, { songUri, tempo, timeSignature, duration }) {
        state.songAnalysis = {
            songUri,
            tempo,
            timeSignature,
            duration,
        }
    },
}

const actions = {
    async updateSong({ commit, getters, state, rootState }, { songUri }) {
        if (songUri === state.songUri)
            return

        commit('setSongUri', { songUri })
        const songId = getters.songId

        const { tempo, time_signature, duration_ms } = await rootState.spotifyApi.getAudioFeaturesForTrack(songId)
        const { name, album, artists } = await rootState.spotifyApi.getTrack(songId)

        commit('setSongCatalogInfo', {
            songUri,
            name,
            imageUrl: album.images[0].url,
            artist: artists[0].name,
        })
        commit('setSongAnalysis', {
            songUri,
            tempo,
            timeSignature: time_signature,
            duration: duration_ms / 1000.0,
        })
    },
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
}
