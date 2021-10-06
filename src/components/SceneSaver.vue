<template>
    <!-- Saving and loading tracks -->
    <div style="margin-top: 20px">
        <input v-model="sceneSaveName" placeholder="Save as...">
        <v-btn @click="onSaveScene">Save</v-btn>
        <select v-model="selectedSceneName">
            <option v-for="(_, sceneName) in storedScenes" :value="sceneName" :key="sceneName">
            {{ sceneName }}
            </option>
        </select>
        <v-btn @click="onLoadScene">Load</v-btn>
        <v-btn @click="onDeleteScene">Delete</v-btn>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { SAVED_SCENES_KEY } from '../constants'
import _ from 'lodash'

export default {
    name: 'SceneSaver',
    data() {
        return {
            storedScenes: [],
            sceneSaveName: '',
            selectedSceneName: '',
        }
    },
    computed: {
        ...mapState([ 'spotifyApi' ]),
        ...mapState('song', [ 'songUri' ]),
        ...mapState('timeline', [ 'clickTracks', 'songStartSeconds' ]),
    },
    methods: {
        ...mapActions('song', [ 'updateSong' ]),
        onSaveScene() {
            const scene = {
                songUri: this.songUri,
                songStartSeconds: this.songStartSeconds,
                clickTracks: _.cloneDeep(this.clickTracks),
            }
            this.$set(this.storedScenes, this.sceneSaveName, scene)
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
            this.$delete(this.storedScenes, this.selectedSceneName)
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
        window.addEventListener('beforeunload', this.saveScenesToLocalStorage)
    },
}
</script>

<style>

</style>
