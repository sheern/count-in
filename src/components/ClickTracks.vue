<template>
    <div>
        <ClickTrack v-for="(cl, index) in clickTracks" :clickTrack="cl"
        v-on:remove="clickTracks.splice(index, 1)" :songDuration="currentSong.duration" :songStartTime="songStartTime" :key="cl.id" />
        <button v-on:click="addClickTrack">Add click track</button>
    </div>
</template>

<script>
import ClickTrack from '@/components/ClickTrack.vue'
import { createClickTrack } from '@/utils'

export default {
    name: 'ClickTracks',
    components: {
        ClickTrack,
    },
    props: [ 'clickTracks', 'currentSong', 'songStartTime' ],
    methods: {
        addClickTrack() {
            const { tempo = 120, timeSignature = 4 } = this.currentSong || {}
            this.clickTracks.push(createClickTrack(0, tempo, timeSignature))
        },
    },
}
</script>

