<template>
    <v-row align="center">
        <!-- TODO validation (e.g. bpm > 0) -->
        <v-col cols="6" sm="2">
            <v-text-field v-model.number="clickTrack.bpm" type="number"
                label="BPM"
                persistent-hint :hint="`${secondsPerClick.toFixed(3)}s per beat`">
            </v-text-field>
        </v-col>

        <v-col cols="6" sm="2">
            <v-text-field v-model.number="clickTrack.beats" type="number"
                label="Total beats">
            </v-text-field>
        </v-col>

        <v-col cols="12" sm="8">
            <v-slider :value="clickTrack.startTime" @end="onStartTimeSliderRelease" :max="maxStartTime" step="0.01"
            :label="startTimeSliderHint"
            thumb-label thumb-size="40">
                <template v-slot:append>
                    <v-btn @click="bumpClickStart(-0.1)" icon>
                        <v-icon color="red">mdi-minus</v-icon>
                    </v-btn>
                    <v-btn @click="bumpClickStart(0.1)" icon>
                        <v-icon color="green">mdi-plus</v-icon>
                    </v-btn>

                    <v-btn @click="removeClickTrack"
                        class="ml-1"
                        fab x-small>
                        <v-icon color="red">
                            mdi-trash-can-outline
                        </v-icon>
                    </v-btn>
                </template>
                <template v-slot:thumb-label="{ value: startTimeSeconds }">
                    {{ formatMinutesAndSeconds(startTimeSeconds) }}
                </template>
            </v-slider>
        </v-col>
    </v-row>
</template>

<script>
import { formatMinutesAndSeconds, computeSecondsPerClick } from '@/utils'

export default {
    name: 'ClickTrack',
    props: [ 'clickTrack', 'timelineDuration' ],
    computed: {
        secondsPerClick() {
            return computeSecondsPerClick(this.clickTrack.bpm)
        },
        maxStartTime() {
            return this.timelineDuration - this.trackDuration
        },
        trackDuration() {
            return this.clickTrack.beats * this.secondsPerClick
        },
        startTimeSliderHint() {
            return `Start at ${formatMinutesAndSeconds(this.clickTrack.startTime)}`
        },
    },
    methods: {
        formatMinutesAndSeconds,
        onStartTimeSliderRelease(seconds) {
            this.clickTrack.startTime = seconds
        },
        removeClickTrack() {
            this.$store.commit('timeline/removeClickTrack', { clickTrackId: this.clickTrack.id })
        },
        bumpClickStart(amount) {
            this.clickTrack.startTime += amount
        },
    },
}
</script>

