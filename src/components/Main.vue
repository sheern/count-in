<template>
    <div class="main">
        <div v-if="isSongCatalogInfoLoaded" class="song-details" >
            <v-img class="mx-auto" width="200" aspect-ratio="1" alt="Song image" :src="songCatalogInfo.imageUrl" />
            <h2>{{ songCatalogInfo.name }}</h2>
            <h3 style="color: #999">{{ songCatalogInfo.artist }}</h3>
        </div>
        <div v-if="isSongAnalysisLoaded">
            <Timeline :songDuration="songAnalysis.duration" />
        </div>

        <v-card class="my-4 py-4">
            <Player />
        </v-card>

        <v-card class="my-4 pa-4">
            <TimelineEditor />
        </v-card>

        <v-card class="my-4 py-4">
            <SceneSaver />
        </v-card>

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
import Timeline from '@/components/Timeline.vue'
import TimelineEditor from '@/components/TimelineEditor.vue'
import Player from '@/components/Player.vue'
import SceneSaver from '@/components/SceneSaver.vue'
import { mapGetters, mapState } from 'vuex'

export default {
    name: 'Main',
    components: {
        Timeline,
        TimelineEditor,
        Player,
        SceneSaver,
    },
    data() {
        return {
            showEvents: false,
        }
    },
    computed: {
        ...mapState([ 'spotifyApi', 'spotifyPlayer' ]),
        ...mapState('song', [ 'songUri', 'songAnalysis', 'songCatalogInfo' ]),
        ...mapGetters('song', [ 'songId', 'isSongCatalogInfoLoaded', 'isSongAnalysisLoaded' ]),
        ...mapGetters('timeline', [ 'clickEventTimeline' ]),
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
