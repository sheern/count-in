<template>
    <div>
        <ClickTrack v-for="cl in clickTracks" :clickTrack="cl"
        :songDuration="300" :key="cl.id" />
        <button v-on:click="addClickTrack">Add click track</button>
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
    props: [ 'currentSong' ],
    computed: mapState('timeline', [ 'clickTracks' ]),
    methods: {
        addClickTrack() {
            const { tempo = 120, timeSignature = 4 } = this.currentSong || {}
            this.$store.commit('timeline/addClickTrack', { clickTrack: createClickTrack(0, tempo, timeSignature) })
        },
    },
}
</script>

