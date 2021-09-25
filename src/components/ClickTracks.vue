<template>
    <div>
        <ul>
            <li v-for="cl in clickTracks" :key="cl.id">
		<input class="num-input" v-model.number="cl.bpm" type="number">
		<span class="units">BPM</span>
		<input class="num-input" v-model.number="cl.startTime" type="number">
		<span class="units">seconds</span>
		<input v-model.number="cl.startTime" type="range" min="-2" max="5" step="0.01">
            </li>
        </ul>
        <button v-on:click="addClickTrack">Add click track</button>
    </div>
</template>

<script>
import { createClickTrack } from '../utils'

export default {
    name: 'ClickTracks',
    props: {
        msg: String
    },
    data() {
        return {
            // Upon pressing play, the most negative click track should be treated as 0 in the timeline
            // We can precompute and schedule all the clicks in the AudioContext
            // TODO Or setInterval like cwilso's metronome and only schedule soon-to-arrive clicks
            clickTracks: [
                createClickTrack(),
            ],
        }
    },
    methods: {
        addClickTrack() {
            this.clickTracks.push(createClickTrack());
        }
    }
}
</script>

<style scoped>
.num-input {
    width: 4em;
}

.units {
    padding-left: 0.25em;
    padding-right: 0.5em;
}
</style>
