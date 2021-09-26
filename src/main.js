import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

const app = new Vue({
    render(h) {
        return h(App, {
            props: {
                spotify: this.spotify,
            },
        })
    },
    data: {
        spotify: null,
    },
})

// Load Spotify player into Vue app instance
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Loaded Spotify')
    const token = 'BQAvCmX1Ks5uRppyXuGWvpdDYshCbANS8JSGIs8S7bHN7_BZhbua3t_W_eaDa9c_0oFdLQWxNR0rLPekfTq8NQFZybCK0UyAOsy3TCXBKQUedBbR4FrL-TSX8gk1-jOqwJvb-RNebxIrzHuRt31UvV3Datzu91k'
    app.spotify = new window.Spotify.Player({
        name: 'Count In',
        getOAuthToken: cb => { cb(token) },
        volume: 0.5,
    })

    app.spotify.connect()
}

app.$mount('#app')
