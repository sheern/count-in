<template>
    <div class="main">
        <div class="song-details" v-if="songCatalogInfo">
            <img width="200" height="200" alt="Song image" :src="songCatalogInfo.imageUrl">
            <h2>{{ songCatalogInfo.name }}</h2>
            <h3 style="color: #999">{{ songCatalogInfo.artist }}</h3>
        </div>
        <div v-if="songAnalysis">
            <Timeline :songDuration="songAnalysis.duration" />
            <h4>
                Spotify says the tempo is {{ songAnalysis.tempo }} in time signature {{ songAnalysis.timeSignature }}/4
            </h4>
        </div>

        <Player />

        <hr />
        <span>Start song at </span>
        <input class="num-input" v-model.number="songStartSeconds" type="number">
        <span class="units">s</span>
        <input class="start-time-slider" v-model.number="songStartSeconds" type="range" min="0" max="15" step="0.01">

        <ClickTracks :currentSong="songAnalysis" />
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


        <button @click="showEvents = !showEvents">{{ showEvents ? "Hide click events" : "Show click events" }}</button>
        <div v-if="showEvents" class="events">
            <ul>
                <li v-for="event in clickEventTimeline" :key="event.id">
                    {{ event.time.toFixed(6) }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import ClickTracks from '@/components/ClickTracks.vue'
import Timeline from '@/components/Timeline.vue'
import Player from '@/components/Player.vue'
import { SAVED_SCENES_KEY } from '@/constants'
import { mapGetters, mapState } from 'vuex'
import _ from 'lodash'

export default {
    name: 'Main',
    components: {
        ClickTracks,
        Timeline,
        Player,
    },
    data() {
        return {
            storedScenes: {},
            sceneSaveName: '',
            selectedSceneName: '',

            showEvents: false,
        }
    },
    computed: {
        songStartSeconds: {
            get() {
                return this.$store.state.timeline.songStartSeconds
            },
            set(seconds) {
                this.$store.commit('timeline/setSongStartSeconds', { seconds })
            },
        },
        ...mapState([ 'spotifyApi', 'spotifyPlayer' ]),
        ...mapState('song', [ 'songUri', 'songAnalysis', 'songCatalogInfo' ]),
        ...mapGetters('song', [ 'songId' ]),
        ...mapGetters('timeline', [ 'clickEventTimeline' ]),
    },
    methods: {
        onSaveScene() {
            this.storedScenes[this.sceneSaveName] = {
                songUri: this.songUri,
                songStartSeconds: this.songStartSeconds,
                clickTracks: _.cloneDeep(this.clickTracks),
            }
        },
        // TODO Make sure that the Player component is stopped upon load
        onLoadScene() {
            const scene = this.storedScenes[this.selectedSceneName]
            if (!scene)
                return

            this.updateSong({ songUri: scene.songUri })
            this.$store.commit('timeline/setClickTracks', { clickTracks: _.cloneDeep(scene.clickTracks) })
            this.$store.commit('timeline/setSongStartSeconds', { seconds: scene.songStartSeconds })
            this.spotifyApi.play({ uris: [scene.songUri] })
                .then(() => {
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
