<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <div></div>
    <button v-on:click="onPlay">{{ playingText }}</button>
    <ClickTracks :clickTracks="clickTracks" />
    <div id="events">Click Events
        <ul>
            <li v-for="event in eventTimeline" :key="event.id">
                {{ event.time.toFixed(3) }} {{ event.type }}
            </li>
        </ul>
    </div>
  </div>
</template>

<script>
import ClickTracks from './components/ClickTracks.vue'
import { computeEventTimeline, createClickTrack } from './utils'

export default {
    name: 'App',
    components: {
        ClickTracks,
    },
    props: ['spotify', 'audioCtx'],
    data() {
        return {
            playing: false,
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [ createClickTrack() ],
        }
    },
    computed: {
        playingText: function() { return this.playing ? 'Stop' : 'Play' },
        eventTimeline() {
            return computeEventTimeline(this.clickTracks)
        },
    },
    methods: {
        onPlay: function() {
            this.playing = !this.playing
            if (this.playing) {
                let eventTimeline = this.eventTimeline
                console.log(eventTimeline)
            }
            else {
                this.spotify.pause()
            }
        },
        onReset: function() { this.spotify.seek(0) },

        scheduleSong(delay) {
            setTimeout(() => this.spotify.resume(), delay * 1000)
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
