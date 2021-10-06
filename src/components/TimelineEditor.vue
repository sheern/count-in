<template>
    <div>
        <span>Start song after</span>
        <input class="num-input" v-model.number="songStartSeconds" type="number">
        <span class="units">s</span>
        <input class="start-time-slider" v-model.number="songStartSeconds" type="range" min="0" max="15" step="0.01">

        <ClickTracks />
    </div>
</template>

<script>
import ClickTracks from '@/components/ClickTracks.vue'

export default {
    name: 'TimelineEditor',
    components: {
        ClickTracks,
    },
    computed: {
        songStartSeconds: {
            get() {
                return this.$store.state.timeline.songStartSeconds
            },
            set(seconds) {
                this.$store.commit('timeline/setSongStartSeconds', { seconds })
            },
        },
    },
}
</script>

<style>

</style>
