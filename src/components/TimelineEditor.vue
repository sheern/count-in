<template>
    <v-container class="pa-0">
        <v-slider :value="songStartSeconds" @end="setSongStartSeconds" type="number" :max="MAX_SONG_START_SECONDS" step="0.1"
        :label="songStartTimeSliderHint"
        thumb-label thumb-size="40">
            <template v-slot:append>
                <v-btn @click="bumpSongStart(-0.1)" icon>
                    <v-icon color="red">mdi-minus</v-icon>
                </v-btn>
                <v-btn @click="bumpSongStart(0.1)" icon>
                    <v-icon color="green">mdi-plus</v-icon>
                </v-btn>
            </template>
            <template v-slot:thumb-label="{ value: songStartSeconds }">
                {{ formatMinutesAndSeconds(songStartSeconds) }}
            </template>
        </v-slider>

        <div class="mt-4"></div>

        <ClickTracks />
    </v-container>
</template>

<script>
import ClickTracks from '@/components/ClickTracks.vue'
import { formatMinutesAndSeconds } from '@/utils'
import { mapState } from 'vuex'

export default {
    name: 'TimelineEditor',
    components: {
        ClickTracks,
    },
    computed: {
        ...mapState('timeline', [ 'songStartSeconds' ]),
        songStartTimeSliderHint() {
            return `Start song at ${formatMinutesAndSeconds(this.songStartSeconds)}`
        },
        MAX_SONG_START_SECONDS() {
            return 15
        },
    },
    methods: {
        formatMinutesAndSeconds,
        setSongStartSeconds(seconds) {
            if (seconds >= 0 && seconds <= this.MAX_SONG_START_SECONDS)
                this.$store.commit('timeline/setSongStartSeconds', { seconds })
        },
        bumpSongStart(amount) {
            this.setSongStartSeconds(this.songStartSeconds + amount)
        },
    },
}
</script>
