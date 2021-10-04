<template>
    <div id="app">
        <div v-if="!isLoading">
            <Login v-if="!accessToken" />
            <div v-else>
                <div v-if="isConnected">
                    <Main />
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
import { mapActions, mapState } from 'vuex'

export default {
    name: 'App',
    data() {
        return {
            isLoading: false,
            isConnected: false,
        }
    },
    components: {
        Login,
        Main,
    },
    computed: mapState(['accessToken']),
    methods: {
        ...mapActions('song', [ 'updateSong' ]),
        initializeSpotifyPlayer() {
            const player = new window.Spotify.Player({
                name: 'Count In',
                getOAuthToken: cb => {
                    cb(this.accessToken)
                },
                volume: 0.5,
            })

            this.$store.commit('setSpotifyPlayer', { spotifyPlayer: player })

            player.addListener('ready', ({ device_id }) => {
                console.log('Spotify Web Playback ready with Device ID', device_id)
            })

            // TODO remove this listener upon destruction of component
            player.addListener('player_state_changed',
                state => {
                    this.isConnected = !!state

                    if (state) {
                        const track = state.track_window.current_track
                        this.updateSong({ songUri: track.uri })
                    }
                })

            player.connect()
        },
    },
    created() {
        const authCode = new URLSearchParams(window.location.search).get('code')
        if (authCode) {
            this.isLoading = true
            // Make post request for token
            const urlEncodedBody = new URLSearchParams(tokenEndpointBody(authCode)).toString()
            axios.post(TOKEN_URL,
                urlEncodedBody,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }})
                .then(res => {
                    unsetCodeVerifier()

                    const accessToken = res.data.access_token
                    const refreshToken = res.data.refresh_token
                    const expiresInMs = res.data.expires_in * 1000
                    this.$store.dispatch('updateAuthentication', { accessToken, refreshToken, expiresInMs })

                    const script = document.createElement('script')
                    script.src = 'https://sdk.scdn.co/spotify-player.js'
                    script.async = true
                    document.body.appendChild(script)

                    window.onSpotifyWebPlaybackSDKReady = this.initializeSpotifyPlayer

                    // Redirect to / without refresh
                    this.isLoading = false
                    window.history.pushState(null, '', '/')
                })
                .catch(error => {
                    // Redirect to login page
                    console.warn('Could not authenticate user, redirecting back to login page')
                    console.error(error)
                    this.isLoading = false
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
