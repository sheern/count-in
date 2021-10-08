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
            <v-slider v-model.number="clickTrack.startTime" min="0" :max="maxStartTime" step="0.01"
                persistent-hint :hint="`Start click track after ${clickTrack.startTime} seconds`">
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
            </v-slider>
        </v-col>
    </v-row>
</template>

<script>
import { computeSecondsPerClick } from '@/utils'

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
    },
    methods: {
        removeClickTrack() {
            this.$store.commit('timeline/removeClickTrack', { clickTrackId: this.clickTrack.id })
        },
        bumpClickStart(amount) {
            this.clickTrack.startTime += amount
        },
    },
}
</script>

