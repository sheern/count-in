<template>
    <v-container class="pa-0">
        <v-slider v-model="songStartSeconds" type="number" min="0" max="15" step="0.01"
            persistent-hint :hint="`Start song after ${songStartSeconds} seconds`">
            <template v-slot:append>
                <v-btn @click="bumpSongStart(-0.1)" icon>
                    <v-icon color="red">mdi-minus</v-icon>
                </v-btn>
                <v-btn @click="bumpSongStart(0.1)" icon>
                    <v-icon color="green">mdi-plus</v-icon>
                </v-btn>
            </template>
        </v-slider>

        <div class="mt-4"></div>

        <ClickTracks />
    </v-container>
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
    methods: {
        bumpSongStart(amount) {
            this.songStartSeconds += amount
        },
    },
}
</script>
