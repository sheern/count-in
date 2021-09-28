<template>
    <div class="click-track">
        <!-- TODO validation (e.g. bpm > 0) -->
        <input class="num-input" v-model.number="clickTrack.bpm" type="number">
        <span class="units">BPM ({{ secondsPerClick.toFixed(3) }}s per click)</span>

        <input class="num-input" v-model.number="clickTrack.count" type="number">
        <span class="units">beats</span>

        <span>Start at </span>
        <input class="num-input" v-model.number="clickTrack.startTime" type="number">
        <span class="units">s</span>
        <input id="start-time-slider" v-model.number="clickTrack.startTime" type="range" min="0" max="20" step="0.01">
    </div>
</template>

<script>
export default {
    name: 'ClickTrack',
    props: [ 'clickTrack' ],
    computed: {
        secondsPerClick() {
            return 60.0 / this.clickTrack.bpm
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
