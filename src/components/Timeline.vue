<template>
    <div class="timeline-container">
        <!-- timeline elements location relative to parent container -->
        <div class="track-container">
            <span class="event" :style="songStyle"></span>
        </div>

        <div class="track-container" v-for="cl in clickTracks" :key="cl.id">
            <span class="event" :style="clickStyle(cl)"></span>
        </div>

    </div>
</template>

<script>
import { computeSecondsPerClick } from '@/utils'
import { mapState } from 'vuex'

export default {
    name: 'Timeline',
    props: [ 'songDuration' ],
    computed: {
        ...mapState('timeline', [ 'songStartSeconds', 'clickTracks' ]),
        songStyle() {
            return {
                left: this.percentageInTimeline(this.songStartSeconds) + '%',
                width: this.percentageInTimeline(this.songDuration) + '%',
                'background-color': '#a34',
            }
        },
        totalDuration() {
            return this.songDuration + this.songStartSeconds
        },
    },
    methods: {
        clickStyle(clickTrack) {
            const duration = clickTrack.beats * computeSecondsPerClick(clickTrack.bpm)
            return {
                left: this.percentageInTimeline(clickTrack.startTime) + '%',
                width: this.percentageInTimeline(duration) + '%',
                'background-color': '#666',
            }
        },
        percentageInTimeline(time) {
            return (time / this.totalDuration) * 100
        },
    },
}

</script>

<style>
.timeline-container {
    width: 100%;
    text-align: left;
    background-color: #000;
    border-color: #000;
    border-radius: 3px;
    border-left: 3px solid;
    border-right: 3px solid;
}

.track-container {
    width: 100%;
}

.event {
    display: inline-block;
    position: relative;
    padding: 5px 0 5px 0;
}
</style>
