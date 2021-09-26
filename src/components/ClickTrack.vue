<template>
    <li>
        <!-- TODO validation (e.g. bpm > 0) -->
        <input class="num-input" v-model.number="clickTrack.bpm" type="number">
        <span class="units">BPM ({{ secondsPerClick.toFixed(3) }}s per click)</span>

        <input class="num-input" v-model.number="clickTrack.count" type="number">
        <span class="units">beats</span>

        <span>Start at </span>
        <input class="num-input" v-model.number="clickTrack.startTime" type="number">
        <span class="units">s (relative to song)</span>
        <input id="start-time-slider" v-model.number="clickTrack.startTime" type="range" min="-5" max="10" step="0.01">
    </li>
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

<style scoped>
.num-input {
    width: 4em;
}

.units {
    padding-left: 0.25em;
    padding-right: 2em;
}

#start-time-slider {
    width: 20em;
}
</style>
