<template>
    <div>
        <div v-for="cl in clickTracks" :key="cl.id">
            <v-divider class="my-4"></v-divider>
            <ClickTrack :clickTrack="cl" :timelineDuration="timelineDuration" />
        </div>

        <v-divider class="my-4"></v-divider>
        <v-btn @click="addClickTrack"
            block>
            Add click track
            <v-icon right
                color="primary">
                mdi-metronome
            </v-icon>
        </v-btn>
    </div>
</template>

<script>
import ClickTrack from '@/components/ClickTrack.vue'
import { createClickTrack } from '@/utils'
import { mapState } from 'vuex'

export default {
    name: 'ClickTracks',
    components: {
        ClickTrack,
    },
    computed: {
        ...mapState('timeline', [ 'clickTracks', 'songStartSeconds' ]),
        timelineDuration() {
            const { duration = 300 } = this.nullSafeSongAnalysis
            return duration + this.songStartSeconds
        },
        nullSafeSongAnalysis() {
            return this.$store.state.song.songAnalysis || {}
        },
    },
    methods: {
        addClickTrack() {
            const { tempo = 120, timeSignature = 4 } = this.nullSafeSongAnalysis
            const clickTrack = createClickTrack(0, tempo, timeSignature)
            this.$store.commit('timeline/addClickTrack', { clickTrack })
        },
    },
}
</script>

