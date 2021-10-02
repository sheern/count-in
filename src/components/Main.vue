<template>
    <div class="main">
        <div class="song-details" v-if="currentSongDetails">
            <img width="200" height="200" alt="Song image" :src="currentSongDetails.imageUrl">
            <h2>{{ currentSongDetails.songName }}</h2>
            <h3 style="color: #999">{{ currentSongDetails.artistName }}</h3>
        </div>
        <div v-if="currentSongAnalysis">
            <Timeline :songDuration="currentSongAnalysis.duration"
                :songStartTime="songStartTime" :clickTracks="clickTracks" />
            <h4>
                Spotify says the tempo is {{ currentSongAnalysis.tempo }} in time signature {{ currentSongAnalysis.timeSignature }}/4
            </h4>
        </div>

        <Player :spotifyPlayer="spotifyPlayer" :audioCtx="audioCtx" :eventTimeline="eventTimeline" :songStartTime="songStartTime" />

        <span>Start song at </span>
        <input class="num-input" v-model.number="songStartTime" type="number">
        <span class="units">s</span>
        <input class="start-time-slider" v-model.number="songStartTime" type="range" min="0" max="15" step="0.01">

        <ClickTracks :clickTracks="clickTracks" :currentSong="currentSongAnalysis" :songStartTime="songStartTime"/>

        <!-- <button @click="onSave">Save</button> -->
        <!-- <select name=""> -->
        <!--     <option v-for -->
        <!-- <button @click="onLoad">Load</button> -->

        <div class="events">Timeline Events
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
import { computeEventTimeline } from '@/utils'

export default {
    name: 'Main',
    components: {
        ClickTracks,
        Timeline,
        Player,
    },
    props: ['spotifyPlayer', 'spotifyApi'],
    data() {
        return {
            songStartTime: 2,
            songId: 0,
            currentSongDetails: null,
            currentSongAnalysis: null,
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [],
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
                    app.currentSongAnalysis = {
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
        // TODO remove this listener upon destruction of component
        this.spotifyPlayer.addListener('player_state_changed',
            function songUpdater(state) {
                if (state) {
                    const track = state.track_window.current_track
                    app.currentSongDetails = {
                        songName: track.name,
                        artistName: track.artists[0].name,
                        imageUrl: track.album.images[0].url,
                    }
                    app.songId = track.id
                }
            })
    },
}
</script>

<style>
.song-details {
    margin-bottom: 10px;
}

.num-input {
    width: 4em;
}

.units {
    padding-left: 0.25em;
    padding-right: 2em;
}

.start-time-slider {
    width: 20em;
}

.controls {
    margin-bottom: 1em;
}
</style>
