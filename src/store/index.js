import Vue from 'vue'
import Vuex from 'vuex'
import SpotifyWebApi from 'spotify-web-api-js'
import timeline from '@/store/modules/timeline'
import song from '@/store/modules/song'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        accessToken: null,
        refreshToken: null,
        accessTokenExpirationMs: null,

        spotifyApi: new SpotifyWebApi(),
        // The class window.Spotify is polyfilled in the Web Playback SDK script
        // We can only initialize once it is ready (once window.onSpotifyWebPlaybackSDKReady is called)
        spotifyPlayer: null,
        audioContext: new AudioContext(),
    },
    mutations: {
        setAccessToken(state, { accessToken }) {
            state.accessToken = accessToken
        },
        setRefreshToken(state, { refreshToken }) {
            state.refreshToken = refreshToken
        },
        setAccessTokenExpirationMs(state, { currentTimeMs, expiresInMs }) {
            state.accessTokenExpirationMs = currentTimeMs + expiresInMs
        },
        setSpotifyPlayer(state, { spotifyPlayer }) {
            state.spotifyPlayer = spotifyPlayer
        },
    },
    actions: {
        updateAuthentication({ commit, state }, { accessToken, refreshToken, expiresInMs }) {
            commit('setAccessToken', { accessToken })
            commit('setRefreshToken', { refreshToken })
            commit('setAccessTokenExpirationMs', { currentTimeMs: Date.now(), expiresInMs })

            state.spotifyApi.setAccessToken(accessToken)
        },
    },
    modules: {
        timeline,
        song,
        // playback,
    },
})

