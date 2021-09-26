import Vue from 'vue'
import App from './App.vue'
import { TOKEN } from './constants'

Vue.config.productionTip = false

// Load Spotify player into Vue app instance
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Loaded Spotify')
    let spotify = new window.Spotify.Player({
        name: 'Count In',
        getOAuthToken: cb => { cb(TOKEN) },
        volume: 0.5,
    })
    spotify.connect()

    new Vue({
        render(h) {
            return h(App, {
                props: {
                    spotify,
                    audioCtx: new AudioContext(),
                },
            })
        },
    }).$mount('#app')
}

