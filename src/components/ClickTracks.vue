<template>
    <div>
        <ClickTrack v-for="cl in clickTracks" :clickTrack="cl" :key="cl.id" />
        <button v-on:click="addClickTrack">Add click track</button>
    </div>
</template>

<script>
import ClickTrack from './ClickTrack.vue'
import { createClickTrack } from '../utils'

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

