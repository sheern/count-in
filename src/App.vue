<template>
    <div id="app">
        <img alt="Vue logo" src="./assets/logo.png">
        <div></div>
        <h4>Use Spotify Connect from the desktop client or phone to control the current song</h4>
        <div id="Controls">
            <button v-on:click="onPlay">{{ playingText }}</button>
            <button v-on:click="onReset">Reset</button>
        </div>
        <h4 v-if="songId">
            Spotify says the tempo is {{ currentSong.tempo }} in time signature {{ currentSong.timeSignature }}/4
        </h4>
        <ClickTracks :clickTracks="clickTracks" />
        <div id="events">Timeline Events
            <ul>
                <li v-for="event in eventTimeline" :key="event.id">
                    {{ event.time.toFixed(6) }} {{ event.type }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import ClickTracks from './components/ClickTracks.vue'
import { computeEventTimeline, createClickTrack } from './utils'
import { EventType } from './constants.js'

export default {
    name: 'App',
    components: {
        ClickTracks,
    },
    props: ['spotify', 'audioCtx'],
    data() {
        return {
            playing: false,
            songId: 0,
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [ createClickTrack() ],
        }
    },
    created() {
        console.log('Spotify initialized')
        let app = this
        this.spotify.addListener('player_state_changed',
            ({ track_window: { current_track } }) => {
                if (current_track) {
                    console.log(current_track.name)
                    // does this still propagate to dependents when the value is the same as before?
                    // answer: NO, it's smart and propagates if value changed
                    app.songId = current_track.id
                }
            })
    },
    computed: {
        playingText() { return this.playing ? 'Stop' : 'Play' },
        eventTimeline() {
            return computeEventTimeline(this.clickTracks)
        },
        currentSong() {
            return { tempo: 1, time_signature: 1 }
        },
    },
    methods: {
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioCtx.resume()
                let eventTimeline = this.eventTimeline
                eventTimeline.forEach(this.scheduleEvent)
                console.log(eventTimeline)
            }
            else {
                // TODO once I have an event loop, I would stop it here
                // Maintain track position so user can resume
                this.spotify.pause()
            }
        },
        onReset() {
            this.spotify.pause()
            this.spotify.seek(0)
        },

        scheduleEvent(event) {
            if (event.type === EventType.CLICK) {
                // schedule click in audioCtx
                this.scheduleClick(event.time)
            }
            else if (event.type === EventType.SONG_START) {
                this.scheduleSong(event.time)
            }
            else {
                console.warn(`Cannot process event of type ${event.type}`)
            }
        },
        scheduleSong(delay) {
            setTimeout(() => this.spotify.resume(), delay * 1000)
        },
        // TODO I should instead have everything relative to the time
        // the play button was pressed for rock-solid timing
        scheduleClick(time) {
            let audioCtx = this.audioCtx
            let osc = audioCtx.createOscillator()
            osc.frequency.value = 440
            osc.connect(audioCtx.destination)

            let currentTime = audioCtx.currentTime
            osc.start(currentTime + time)
            osc.stop(currentTime + time + 0.05)
        },
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
