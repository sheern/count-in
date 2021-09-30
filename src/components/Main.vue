<template>
    <div id="main">
        <h4>Use Spotify Connect from the desktop client or phone to control the current song</h4>

        <Timeline v-if="currentSong" :timelineLength="currentSong.duration"
        :songStartTime="songStartTime" :clickTracks="clickTracks" />

        <Player :spotifyPlayer="spotifyPlayer" :audioCtx="audioCtx" :eventTimeline="eventTimeline" />

        <span>Start song at </span>
        <input class="num-input" v-model.number="songStartTime" type="number">
        <span class="units">s</span>
        <input id="start-time-slider" v-model.number="songStartTime" type="range" min="0" max="300" step="0.01">

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
import ClickTracks from '@/components/ClickTracks.vue'
import Timeline from '@/components/Timeline.vue'
import Player from '@/components/Player.vue'
import { computeEventTimeline, createClickTrack } from '@/utils'

export default {
    name: 'Main',
    components: {
        ClickTracks,
        Timeline,
        Player,
    },
    props: ['spotifyPlayer', 'spotifyApi', 'token'],
    data() {
        return {
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
        eventTimeline() {
            return computeEventTimeline(this.clickTracks, this.songStartTime)
        },
    },
    watch: {
        songId(newSongId) {
            if (!newSongId)
                return

            let app = this
            // Use audio analysis endpoint instead
            this.spotifyApi.getAudioFeaturesForTrack(newSongId)
                .then(({ tempo, time_signature, duration_ms }) => {
                    app.currentSong = {
                        tempo,
                        timeSignature: time_signature,
                        duration: duration_ms / 1000.0,
                    }
                })
        },
    },
    created() {
        console.log('Adding playback state handler to listen for song changes')
        let app = this
        this.spotifyPlayer.addListener('player_state_changed',
            ({ track_window: { current_track } }) => {
                if (current_track) {
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
