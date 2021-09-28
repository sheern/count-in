<template>
    <div id="main">
        <h4>Use Spotify Connect from the desktop client or phone to control the current song</h4>
        <div id="controls">
            <button v-on:click="onPlay">{{ playingText }}</button>
            <button v-on:click="onReset">Reset</button>
        </div>
        <span>Start song at </span>
        <input class="num-input" v-model.number="songStartTime" type="number">
        <span class="units">s</span>
        <input id="start-time-slider" v-model.number="songStartTime" type="range" min="0" max="20" step="0.01">


        <ClickTracks :clickTracks="clickTracks" />
        <h4 v-if="currentSong">
            Spotify says the tempo is {{ currentSong.tempo }} in time signature {{ currentSong.timeSignature }}/4
        </h4>


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
import ClickTracks from './ClickTracks.vue'
import { computeEventTimeline, createClickTrack } from '../utils'
import { EventType } from '../constants.js'

export default {
    name: 'Main',
    components: {
        ClickTracks,
    },
    props: ['spotifyPlayer', 'spotifyApi', 'token'],
    data() {
        return {
            playing: false,
            songStartTime: 2,
            songId: 0,
            currentSong: null,
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [ createClickTrack() ],
            audioCtx: new AudioContext(),
        }
    },
    computed: {
        playingText() { return this.playing ? 'Stop' : 'Play' },
        eventTimeline() {
            return computeEventTimeline(this.clickTracks, this.songStartTime)
        },
    },
    watch: {
        songId(newSongId) {
            if (!newSongId)
                return

            let app = this
            console.log('test')
            // Use audio analysis endpoint instead
            this.spotifyApi.getAudioFeaturesForTrack(newSongId)
                .then(({ tempo, time_signature }) => {
                    app.currentSong = {
                        tempo,
                        timeSignature: time_signature,
                    }
                })
        },
    },
    methods: {
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioCtx.resume()
                let eventTimeline = this.eventTimeline
                eventTimeline.forEach(this.scheduleEvent)
            }
            else {
                // TODO once I have an event loop, I would stop it here
                // Maintain track position so user can resume
                this.spotifyPlayer.pause()
            }
        },
        onReset() {
            this.spotifyPlayer.pause()
            this.spotifyPlayer.seek(0)
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
            setTimeout(() => this.spotifyPlayer.resume(), delay * 1000)
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
    created() {
        console.log('Adding playback state handler to listen for song changes')
        let app = this
        this.spotifyPlayer.addListener('player_state_changed',
            ({ track_window: { current_track } }) => {
                if (current_track) {
                    console.log(current_track.name)
                    // does this still propagate to dependents when the value is the same as before?
                    // answer: NO, it's smart and propagates if value changed
                    app.songId = current_track.id
                }
            })
    },
}
</script>

<style>
.num-input {
    width: 4em;
}

.units {
    padding-left: 0.25em;
    padding-right: 2em;
}

#start-time-slider {
    width: 20em;
}

#controls {
    margin-bottom: 1em;
}
</style>
