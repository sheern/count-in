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

        <hr />
        <span>Start song at </span>
        <input class="num-input" v-model.number="songStartTime" type="number">
        <span class="units">s</span>
        <input class="start-time-slider" v-model.number="songStartTime" type="range" min="0" max="15" step="0.01">

        <ClickTracks :clickTracks="clickTracks" :currentSong="currentSongAnalysis" :songStartTime="songStartTime"/>
        <hr />

        <!-- Saving and loading tracks -->
        <div style="margin-top: 20px">
            <input v-model="sceneSaveName" placeholder="Save as...">
            <button @click="onSaveScene">Save</button>
            <select v-model="selectedSceneName">
                <option v-for="(_, sceneName) in storedScenes" :value="sceneName" :key="sceneName">
                {{ sceneName }}
                </option>
            </select>
            <button @click="onLoadScene">Load</button>
            <button @click="onDeleteScene">Delete</button>
        </div>
        <hr />


        <button @click="showEvents = !showEvents">{{ showEvents ? "Hide events" : "Show events" }}</button>
        <div v-if="showEvents" class="events">
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
import { SAVED_SCENES_KEY } from '@/constants'
import _ from 'lodash'

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
            currentSongDetails: null,
            currentSongAnalysis: null,
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [],
            audioCtx: new AudioContext(),

            songUri: null,
            storedScenes: {},
            sceneSaveName: '',
            selectedSceneName: '',

            showEvents: false,
        }
    },
    computed: {
        eventTimeline() {
            return computeEventTimeline(this.clickTracks, this.songStartTime)
        },
        // Extract the Spotify song id (everything past the last :
        songId() {
            if (!this.songUri) {
                return null
            }

            return this.songUri.split(':').at(-1)
        },
    },
    watch: {
        songUri(newSongUri) {
            if (!newSongUri)
                return

            const newSongId = this.songId
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
    methods: {
        onSaveScene() {
            this.storedScenes[this.sceneSaveName] = {
                songUri: this.songUri,
                songStartTime: this.songStartTime,
                clickTracks: _.cloneDeep(this.clickTracks),
            }
        },
        // TODO Make sure that the Player component is stopped upon load
        onLoadScene() {
            const scene = this.storedScenes[this.selectedSceneName]
            if (!scene)
                return

            this.spotifyApi.play({ uris: [scene.songUri] })
                .then(() => {
                    // Load scene values
                    this.songUri = scene.songUri
                    this.songStartTime = scene.songStartTime
                    this.clickTracks = _.cloneDeep(scene.clickTracks)

                    // Pause the playback by default
                    this.spotifyApi.pause()
                })
        },
        onDeleteScene() {
            delete this.storedScenes[this.selectedSceneName]
        },

        saveScenesToLocalStorage() {
            localStorage.setItem(SAVED_SCENES_KEY, JSON.stringify(this.storedScenes))
        },
        loadScenesFromLocalStorage() {
            this.storedScenes = JSON.parse(localStorage.getItem(SAVED_SCENES_KEY)) || {}
        },
    },
    created() {
        this.loadScenesFromLocalStorage()

        let app = this
        console.log('Adding playback state handler to listen for song changes')
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
                    app.songUri = track.uri
                }
            })
    },
    beforeDestroy() {
        this.saveScenesToLocalStorage()
    },
}
</script>

<style>
hr {
    border: 1px solid #000;
}

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
