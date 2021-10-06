<template>
    <div class="click-track">
        <!-- TODO validation (e.g. bpm > 0) -->
        <input class="num-input" v-model.number="clickTrack.bpm" type="number">
        <span class="units">BPM ({{ secondsPerClick.toFixed(3) }}s per click)</span>

        <input class="num-input" v-model.number="clickTrack.beats" type="number">
        <span class="units">beats</span>

        <span>Start at </span>
        <input class="num-input" v-model.number="clickTrack.startTime" type="number">
        <span class="units">s</span>
        <input class="start-time-slider" v-model.number="clickTrack.startTime" type="range" min="0" :max="maxStartTime" step="0.01">
        <v-btn v-on:click="removeClickTrack">Remove</v-btn>
    </div>
</template>

<script>
import { computeSecondsPerClick } from '@/utils'

export default {
    name: 'ClickTrack',
    props: [ 'clickTrack', 'songDuration' ],
    computed: {
        secondsPerClick() {
            return computeSecondsPerClick(this.clickTrack.bpm)
        },
        maxStartTime() {
            return (this.songDuration || 300) + this.songStartTime - this.trackDuration
        },
        trackDuration() {
            return this.clickTrack.beats * this.secondsPerClick
        },
    },
    methods: {
        removeClickTrack() {
            this.$store.commit('timeline/removeClickTrack', { clickTrackId: this.clickTrack.id })
        },
    },
}
</script>

<style>
.click-track {
    padding-top: 1em;
    padding-bottom: 1em;
}
</style>
