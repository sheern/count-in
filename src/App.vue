<template>
    <div id="app">
        <div v-if="!loading">
            <Login v-if="!accessToken" />
            <div v-else>
                <div v-if="isConnected">
                    <Main :spotifyPlayer="spotifyPlayer" :spotifyApi="spotifyApi" />
                </div>
                <h3 v-else>Connect to Count Me In from the desktop or mobile Spotify app</h3>
            </div>
        </div>

        <!-- Waiting for Spotify token -->
        <div v-else>
            Waiting for Spotify access token
        </div>
    </div>
</template>

<script>
import Login from '@/auth/Login.vue'
import Main from '@/components/Main.vue'
import axios from 'axios'
import { tokenEndpointBody, unsetCodeVerifier } from '@/auth/utils.js'
import { TOKEN_URL } from '@/auth/auth.json'
import { mapState } from 'vuex'

export default {
    name: 'App',
    data() {
        return {
            loading: false,
            isConnected: false,
            spotifyPlayer: null,
        }
    },
    components: {
        Login,
        Main,
    },
    computed: mapState(['accessToken', 'spotifyApi']),
    methods: {
        prepareSpotifyPlayer() {
            const app = this
            const player = new window.Spotify.Player({
                name: 'Count In',
                getOAuthToken: cb => {
                    cb(app.accessToken)
                },
                volume: 0.5,
            })

            this.spotifyPlayer = player

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id)
            })

            player.addListener('player_state_changed',
                function connectedChecker(state) {
                    app.isConnected = !!state
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

                    // res.data.expires_in == 3600 == 1 hour
                    // res.data.refresh_token is an authorization code

                    const accessToken = res.data.access_token
                    const refreshToken = res.data.refresh_token
                    const expiresInMs = res.data.expires_in * 1000
                    this.$store.dispatch('updateAuthentication', { accessToken, refreshToken, expiresInMs })

                    const script = document.createElement('script')
                    script.src = 'https://sdk.scdn.co/spotify-player.js'
                    script.async = true
                    document.body.appendChild(script)

                    window.onSpotifyWebPlaybackSDKReady = this.prepareSpotifyPlayer

                    // Redirect to / without refresh
                    this.loading = false
                    window.history.pushState(null, '', '/')
                })
                .catch(() => {
                    // Redirect to login page
                    console.warn('Could not authenticate user, redirecting back to login page')
                    this.loading = false
                    window.history.pushState(null, '', '/')
                })
        }
    },
}
</script>

<style>
#app {
    width: 100%;
    height: 100%;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #ddd;
    margin-top: 60px;
}

.events {
    text-align: left;
}
</style>
