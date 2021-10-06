<template>
    <div class="main">
        <div v-if="isSongCatalogInfoLoaded" class="song-details" >
            <img width="200" height="200" alt="Song image" :src="songCatalogInfo.imageUrl">
            <h2>{{ songCatalogInfo.name }}</h2>
            <h3 style="color: #999">{{ songCatalogInfo.artist }}</h3>
        </div>
        <div v-if="isSongAnalysisLoaded">
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

        <SceneSaver />
        <hr />

        <v-btn @click="showEvents = !showEvents">{{ showEvents ? "Hide click events" : "Show click events" }}</v-btn>
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
import SceneSaver from '@/components/SceneSaver.vue'
import { mapGetters, mapState } from 'vuex'

export default {
    name: 'Main',
    components: {
        ClickTracks,
        Timeline,
        Player,
        SceneSaver,
    },
    data() {
        return {
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
        ...mapGetters('song', [ 'songId', 'isSongCatalogInfoLoaded', 'isSongAnalysisLoaded' ]),
        ...mapGetters('timeline', [ 'clickEventTimeline' ]),
    },
    methods: {

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
