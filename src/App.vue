<template>
    <div id="app">
        <div v-if="!loading">
        <img width="150" height="150" alt="Vue logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png">

        <Login v-if="!this.$root.$data.token" />
        <Main v-else-if="this.spotifyPlayer && this.spotifyApi" :spotifyPlayer="spotifyPlayer" :spotifyApi="spotifyApi" />
        </div>

        <!-- Waiting for Spotify token -->
        <div v-else>
        </div>
    </div>
</template>

<script>
import Login from '@/auth/Login.vue'
import Main from '@/components/Main.vue'
import axios from 'axios'
import { tokenEndpointBody, unsetCodeVerifier } from '@/auth/utils.js'
import { TOKEN_URL } from '@/auth/auth.json'
import SpotifyWebApi from 'spotify-web-api-js'

export default {
    name: 'App',
    data() {
        return {
            loading: false,
            spotifyPlayer: null,
            spotifyApi: null,
        }
    },
    components: {
        Login,
        Main,
    },
    methods: {
        prepareSpotifyPlayer() {
            const app = this
            const token = app.$root.$data.token
            const player = new window.Spotify.Player({
                name: 'Count In',
                getOAuthToken: cb => {
                    cb(token)
                },
                volume: 0.5,
            })

            this.spotifyPlayer = player

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id)
            })

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id)
            })

            player.connect()
        },
    },
    created() {
        const authCode = new URLSearchParams(window.location.search).get('code')
        if (authCode) {
            this.loading = true
            // Make post request for token
            const urlEncodedBody = new URLSearchParams(tokenEndpointBody(authCode)).toString()
            axios.post(TOKEN_URL,
                urlEncodedBody,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(res => {
                    unsetCodeVerifier()

                    const token = res.data.access_token
                    this.$root.$data.token = token
                    this.loading = false

                    // Load Web Playback
                    const script = document.createElement('script')
                    script.src = 'https://sdk.scdn.co/spotify-player.js'

                    script.async = true

                    document.body.appendChild(script)
                    window.onSpotifyWebPlaybackSDKReady = this.prepareSpotifyPlayer

                    // Instantiate Web API
                    const spotifyApi = new SpotifyWebApi()
                    spotifyApi.setAccessToken(token)
                    this.spotifyApi = spotifyApi

                    // Redirect to / without refresh
                    window.history.pushState(null, '', '/')
                })
                .catch(() => {
                    // Redirect to login page
                    window.location = '/'
                })
        }
    },
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

#events {
    text-align: left;
}
</style>
