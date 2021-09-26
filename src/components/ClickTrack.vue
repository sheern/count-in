<template>
    <li>
        <input class="num-input" v-model.number="clickTrack.bpm" type="number">
        <span class="units">BPM ({{ secondsPerClick.toFixed(3) }} seconds per click)</span>
        <input class="num-input" v-model.number="clickTrack.startTime" type="number">
        <span class="units">seconds</span>
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
    width: 50em;
}
</style>
