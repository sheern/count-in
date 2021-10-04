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
}

const mutations = {
    setSongUri(state, { songUri }) {
        state.songUri = songUri
    },
    setSongCatalogInfo(state, { name, imageUrl, artist }) {
        state.songCatalogInfo = {
            name,
            imageUrl,
            artist,
        }
    },
    setSongAnalysis(state, { tempo, timeSignature, duration }) {
        state.songAnalysis = {
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
            name,
            imageUrl: album.images[0].url,
            artist: artists[0].name,
        })
        commit('setSongAnalysis', {
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
