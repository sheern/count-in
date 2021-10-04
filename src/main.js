import Vue from 'vue'
import Vuex from 'vuex'
import App from '@/App.vue'
import SpotifyWebApi from 'spotify-web-api-js'

Vue.config.productionTip = false

Vue.use(Vuex)

const store = new Vuex.Store({
    state: {
        accessToken: null,
        refreshToken: null,
        accessTokenExpirationMs: null,

        spotifyApi: new SpotifyWebApi(),
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
    },
    actions: {
        updateAuthentication({ commit, state }, { accessToken, refreshToken, expiresInMs }) {
            commit('setAccessToken', { accessToken })
            commit('setRefreshToken', { refreshToken })
            commit('setAccessTokenExpirationMs', { currentTimeMs: Date.now(), expiresInMs })

            state.spotifyApi.setAccessToken(accessToken)
        },
    },
})

new Vue({
    store,
    render(h) {
        return h(App)
    },
}).$mount('#app')

