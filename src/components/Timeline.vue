<template>
    <div class="timeline-container">
        <!-- timeline elements location relative to parent container -->
        <div class="track-container">
            <span class="event" :style="toStyle(songStartTime)">Song</span>
        </div>

        <div class="track-container" v-for="cl in clickTracks" :key="cl.id">
            <span class="event" :style="toStyle(cl.startTime)">Click track</span>
        </div>

    </div>
</template>

<script>
export default {
    name: 'Timeline',
    props: ['timelineLength', 'songStartTime', 'clickTracks'],
    methods: {
        toStyle(time) {
            return {
                left: this.percentageInTimeline(time) + '%',
            }
        },
        percentageInTimeline(time) {
            return (time / this.timelineLength) * 100
        },

    },
}
</script>

<style>
.timeline-container {
    width: 100%;
    height: 100px;
    text-align: left;
}

.track-container {
    width: 100%;
}

.event {
    position: relative;
}
</style>
