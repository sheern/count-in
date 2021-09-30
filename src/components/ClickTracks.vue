<template>
    <div>
        <ClickTrack v-for="(cl, index) in clickTracks" :clickTrack="cl"
        v-on:remove="clickTracks.splice(index, 1)" :key="cl.id" />
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
    props: [ 'clickTracks' ],
    methods: {
        addClickTrack() {
            this.clickTracks.push(createClickTrack())
        },
    },
}
</script>

