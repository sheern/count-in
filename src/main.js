import Vue from 'vue'
import App from '@/App.vue'
import SpotifyWebApi from 'spotify-web-api-js'
import { TOKEN } from '@/constants'

Vue.config.productionTip = false

// Load Spotify player into Vue app instance
window.onSpotifyWebPlaybackSDKReady = () => {
    // WEB PLAYBACK
    console.log('Loaded Spotify Web Playback SDK')
    let spotifyPlayer = new window.Spotify.Player({
        name: 'Count In',
        getOAuthToken: cb => { cb(TOKEN) },
        volume: 0.5,
    })
    spotifyPlayer.connect()

    // API
    let spotifyApi = new SpotifyWebApi()
    spotifyApi.setAccessToken(TOKEN)

    new Vue({
        render(h) {
            return h(App, {
                props: {
                    spotifyPlayer,
                    spotifyApi,
                    token: TOKEN,
                },
            })
        },
    }).$mount('#app')
}

