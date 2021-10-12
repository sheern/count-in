import Vue from 'vue'
import Vuex from 'vuex'
import SpotifyWebApi from 'spotify-web-api-js'
import timeline from '@/store/modules/timeline'
import song from '@/store/modules/song'
import axios from 'axios'
import {CLIENT_ID, TOKEN_URL} from '../auth/constants'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        accessToken: null,
        refreshToken: null,

        spotifyApi: new SpotifyWebApi(),
        // The class window.Spotify is polyfilled in the Web Playback SDK script
        // We can only initialize once it is ready (once window.onSpotifyWebPlaybackSDKReady is called)
        // TODO This has strange behavior as part of Vuex's state
        //      When time-traveling in devtools, the player no longer functions
        //      (perhaps relying on some constantly updating internal state
        //      which is irreversibly changed by the time-travel).
        //      It may be preferred to store this stateful object in vm.$data
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
        setSpotifyPlayer(state, { spotifyPlayer }) {
            state.spotifyPlayer = spotifyPlayer
        },
    },
    actions: {
        updateAuthentication({ commit, state, dispatch }, { accessToken, refreshToken, expiresInMs }) {
            commit('setAccessToken', { accessToken })
            state.spotifyApi.setAccessToken(accessToken)

            commit('setRefreshToken', { refreshToken })

            setTimeout(dispatch, expiresInMs - 5000, 'refreshAuthentication')
        },
        refreshAuthentication({ state, dispatch }) {
            const body = {
                grant_type: 'refresh_token',
                refresh_token: state.refreshToken,
                client_id: CLIENT_ID,
            }
            const urlEncodedBody = new URLSearchParams(body).toString()

            axios.post(TOKEN_URL,
                urlEncodedBody,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(res => {
                    dispatch('updateAuthentication', {
                        accessToken: res.data.access_token,
                        refreshToken: res.data.refresh_token,
                        expiresInMs: res.data.expires_in * 1000,
                    })
                        .then(() => console.log('Successfully refreshed Spotify token'))
                })
                .catch(e => {
                    console.warn('Spotify token refresh failed')
                    console.error(e)
                })
        },
    },
    modules: {
        timeline,
        song,
        // playback,
    },
})

