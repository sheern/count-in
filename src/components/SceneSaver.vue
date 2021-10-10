<template>
    <!-- Saving and loading tracks -->
    <div>
        <v-row
            no-gutters class="px-3" align="center">
            <v-text-field v-model="sceneSaveName" placeholder="Save as..."
                                                  outlined hide-details>
            </v-text-field>
            <v-btn @click="onSaveScene"
                rounded>
                Save
            </v-btn>
            <v-spacer></v-spacer>
            <v-select v-model="selectedSceneName"
                      :items="Object.keys(storedScenes)"
                      outlined hide-details>
            </v-select>
            <v-btn @click="onLoadScene"
                rounded>
                Load
            </v-btn>
            <v-btn @click="onDeleteScene"
                rounded>
                Delete
            </v-btn>
        </v-row>
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
            storedScenes: {},
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
            // TODO: Do schema validation in the future
            try {
                this.storedScenes = JSON.parse(localStorage.getItem(SAVED_SCENES_KEY)) || {}
            }
            catch (e) {
                this.storedScenes = {}
            }
        },
    },
    created() {
        this.loadScenesFromLocalStorage()
        window.addEventListener('beforeunload', this.saveScenesToLocalStorage)
    },
}
</script>
