<template>
    <div>
        <h1>{{ this.animTimestamp }}</h1>

        <v-row no-gutters align="center">
            <v-spacer />
            <v-btn @click="onPlay"
                class="mx-1" fab small>
                <v-icon>
                    {{ playing ? 'mdi-pause' : 'mdi-play' }}
                </v-icon>
            </v-btn>
            <v-btn @click="previewMode = !previewMode"
                rounded class="mx-1" :color="previewMode ? 'primary' : ''">
                Preview mode
            </v-btn>
            <v-spacer />
        </v-row>

        <v-row no-gutters class="px-4 pt-6">
            <v-slider v-model.number="sliderValue" @end="onSliderEnd" :step="0.1" :max="timelineDuration"
                      label="Seek to" :hint="`${sliderValue} seconds`" persistent-hint>
                <template v-slot:append>
                    <v-fade-transition>
                        <v-text-field v-if="previewMode" v-model="previewDuration" type="number" min="5"
                            persistent-hint hint="Seconds" label="Preview duration"
                            class="mt-0 pt-0" style="width: 100px">
                        </v-text-field>
                    </v-fade-transition>
                </template>
            </v-slider>
        </v-row>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

// Event loop frequency
const INTERVAL = 200
// Millis to look ahead when scheduling events
const LOOKAHEAD = INTERVAL * 1.25

export default {
    name: 'Player',
    data() {
        return {
            animFrameStartTime: -1,
            animTimestamp: 0,
            songStarted: false,

            playing: false,
            previewMode: false,
            previewDuration: 5,
            sliderValue: 0,
            // The offset applied to elapsed time
            // This is non-zero when pausing the track or seeking to a point in the track
            seekOffsetSeconds: 0,

            // The time we use to schedule events
            audioContextStartTime: 0,
            nextEvent: 0,
            // setTimeout id of the song resume
            songScheduleId: 0,
            // setTimeout id of the preview
            previewScheduleId: 0,
            // setTimeout id of the event loop
            eventLoopId: 0,
        }
    },
    computed: {
        ...mapState([ 'audioContext', 'spotifyPlayer' ]),
        ...mapState('timeline', [ 'songStartSeconds' ]),
        ...mapGetters('timeline', [ 'clickEventTimeline', 'timelineDuration' ]),
    },
    methods: {
        onSliderEnd() {
            console.log('Seek bar released')
            this.playing = false
            this.seekOffsetSeconds = this.sliderValue
            this.stopSong()
            clearTimeout(this.previewScheduleId)
        },
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioContext.resume()
                this.audioContextStartTime = this.audioContext.currentTime

                this.triggerEventLoop()
                if (this.previewMode) {
                    this.beginPreview()
                }
                else {
                    this.seekSpotify()
                    // Set timeout for a a small amount before the song start time
                    // This will begin the request animation frame event loop
                    // I can potentially use this as a shared event loop between
                    //  scheduling clicks and the song itself instead of maintaining 2
                    //  In this case, I should immediately requestAnimationFrame and event loop
                    //   till the playback is stopped
                    requestAnimationFrame(this.animFrameLoop)
                }
            }
            else {
                // Maintain track position so user can resume
                this.seekOffsetSeconds = this.secondsElapsed()
                this.sliderValue = this.seekOffsetSeconds
                this.stopSong()

                clearTimeout(this.previewScheduleId)
            }
        },
        beginPreview() {
            this.audioContextStartTime = this.audioContext.currentTime
            this.seekTo(this.sliderValue)
            this.seekAndScheduleSong()

            if (this.playing) {
                this.previewScheduleId = setTimeout(this.beginPreview, this.previewDuration * 1000)
            }
        },
        seekTo(time) {
            // Prevent seeking to negative times
            const safeTime = Math.max(0, time)
            this.stopSong()
            this.seekOffsetSeconds = safeTime
            this.nextEvent = 0
            this.refreshEventLoop()
        },


        // Request animation frame loop
        animFrameLoop(time) {
            this.animTimestamp = time

            if (!this.playing) {
                this.animFrameStartTime = -1
                this.songStarted = false
                // this.stopSong()
                return
            }

            if (this.animFrameStartTime === -1)
                this.animFrameStartTime = time

            const elapsedSeconds = (time - this.animFrameStartTime) / 1000.0
            // TODO can possibly subtract 1 or 2ms from the start time since request animation frame matches refresh rate
            // Right now the elapsed is ~2ms after the actual desired start time
            if (!this.songStarted && elapsedSeconds >= this.songStartSeconds - this.seekOffsetSeconds) {
                console.log('Resuming song after', elapsedSeconds)
                this.spotifyPlayer.resume()
                this.songStarted = true
            }

            requestAnimationFrame(this.animFrameLoop)
        },



        // TODO do this on a web worker thread to unclog main UI thread
        triggerEventLoop() {
            this.scheduleUpcomingEvents()

            if (this.playing)
                this.eventLoopId = setTimeout(this.triggerEventLoop, INTERVAL)
        },
        refreshEventLoop() {
            clearTimeout(this.eventLoopId)
            this.triggerEventLoop()
        },



        seekSpotify() {
            let seekTime = this.seekOffsetSeconds - this.songStartSeconds
            let seekTimeMs = seekTime * 1000
            this.spotifyPlayer.seek(Math.max(0, seekTimeMs))
        },
        // Scheduling events
        seekAndScheduleSong() {
            let delay = this.songStartSeconds - this.secondsElapsed()
            let delayMs = delay * 1000
            // If we are in the middle of the song (i.e. delay is negative), we should seek to -delayMs
            // If we are before the start of the song (i.e. delay is >= 0), we should seek to 0 to reset the song
            this.spotifyPlayer.seek(Math.max(0, -delayMs))
            this.songScheduleId = setTimeout(() => this.spotifyPlayer.resume(), Math.max(0, delayMs))
        },
        stopSong() {
            clearTimeout(this.songScheduleId)
            this.spotifyPlayer.pause()
        },
        scheduleUpcomingEvents() {
            let windowBegin = this.secondsElapsed()
            let windowEnd = windowBegin + (LOOKAHEAD / 1000.0)

            for (let index = this.nextEvent; index < this.clickEventTimeline.length; index++) {
                let event = this.clickEventTimeline[index]
                if (event.time >= windowBegin && event.time < windowEnd) {
                    this.scheduleClick(event.time)
                    // Don't need to schedule this event in the next loop, only process remaining
                    this.nextEvent = index + 1
                }

                // Remaining events are not ready to be scheduled
                if (event.time >= windowEnd) {
                    break
                }
            }
        },
        scheduleClick(time) {
            let osc = this.audioContext.createOscillator()
            osc.frequency.value = 220
            osc.connect(this.audioContext.destination)

            // Floor at 0 for the very first click
            let secondsTillClick = Math.max(0, time - this.secondsElapsed())
            let clickStart = this.audioContext.currentTime + secondsTillClick
            osc.start(clickStart)
            osc.stop(clickStart + 0.025)
        },

        secondsElapsed() {
            return this.seekOffsetSeconds + (this.audioContext.currentTime - this.audioContextStartTime)
        },
    },
}
</script>

<!-- Scoped style applies to both the current component's node and any child components' ROOT NODE -->
<!-- So I can style the root div of the vue-slider in the Player.vue scoped style -->
<style scoped>
.seek-slider {

}
</style>
