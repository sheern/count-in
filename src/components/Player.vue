<template>
    <div>
        <v-row no-gutters align="center">
            <v-spacer />
            <v-btn @click="onPlay"
                class="mx-1" fab small>
                <v-icon>
                    {{ playing ? 'mdi-pause' : 'mdi-play' }}
                </v-icon>
            </v-btn>
            <v-btn :disabled="playing" @click="previewMode = !previewMode"
                rounded class="mx-1" :color="previewMode ? 'primary' : ''">
                Preview mode
            </v-btn>
            <v-spacer />
        </v-row>

        <v-row no-gutters class="px-4 pt-6">
            <v-slider :value="timelineSecondsElapsed" @end="onSeekBarRelease" :step="0.1" :max="timelineDuration"
                :label="formattedSecondsElapsed">
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
import { toMinutesAndSeconds } from '@/utils'

// Millis to look ahead when scheduling clicks
const CLICK_LOOKAROUND = 50 / 1000.0

const ANIM_LOOP_NOT_STARTED = -1

export default {
    name: 'Player',
    data() {
        return {
            animFrameStartTime: ANIM_LOOP_NOT_STARTED,
            timelineSecondsElapsed: 0,
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
        formattedSecondsElapsed() {
            const { minutes, seconds } = toMinutesAndSeconds(this.timelineSecondsElapsed)
            return minutes + ':' + seconds.toFixed(1).padStart(4, '0')
        },
    },
    methods: {
        onSeekBarRelease(time) {
            this.playing = false
            this.seekTo(time)
            this.stopSong()
            clearTimeout(this.previewScheduleId)

            console.log('Seek bar released', time)
        },
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioContext.resume()
                this.audioContextStartTime = this.audioContext.currentTime

                this.animFrameStartTime = ANIM_LOOP_NOT_STARTED
                requestAnimationFrame(this.animFrameLoop)
                if (this.previewMode) {
                    this.beginPreview()
                }
                else {
                    this.seekSong()
                    // Set timeout for a a small amount before the song start time
                    // This will begin the request animation frame event loop
                    // I can potentially use this as a shared event loop between
                    //  scheduling clicks and the song itself instead of maintaining 2
                    //  In this case, I should immediately requestAnimationFrame and event loop
                    //   till the playback is stopped
                }
            }
            else {
                // Maintain track position so user can resume
                this.seekOffsetSeconds = this.timelineSecondsElapsed
                this.sliderValue = this.seekOffsetSeconds
                this.stopSong()

                clearTimeout(this.previewScheduleId)
            }
        },
        beginPreview() {
            this.stopSong()

            this.animFrameStartTime = ANIM_LOOP_NOT_STARTED
            this.audioContextStartTime = this.audioContext.currentTime
            this.seekTo(this.sliderValue)
            this.seekSong()

            if (this.playing) {
                this.previewScheduleId = setTimeout(this.beginPreview, this.previewDuration * 1000)
            }
        },
        seekTo(time) {
            this.timelineSecondsElapsed = time
            this.seekOffsetSeconds = time
            this.nextEvent = 0
        },


        // Request animation frame loop
        // TODO I should add a small constant BUMP to all events scheduled times (including song)
        // There seems to be issue with starting an oscillator node even just a tiny bit before
        //  the AudioContext.currentTime, with glitching (which makes sense, there's a jump in the waveform)
        // This is most relevant to a click starting at t=0 (since play or preview was started) since any
        //  subsequent click will be pre-empted
        // This suggestion essentially allows pre-empting the first click
        animFrameLoop() {
            if (!this.playing) {
                this.stopSong()
                // this.stopSong()
                return
            }

            const currentTime = this.audioContext.currentTime
            if (this.animFrameStartTime === ANIM_LOOP_NOT_STARTED)
                this.animFrameStartTime = currentTime

            const timelineSecondsElapsed = this.seekOffsetSeconds + (currentTime - this.animFrameStartTime)
            this.timelineSecondsElapsed = timelineSecondsElapsed

            // TODO can possibly subtract 1 or 2ms from the start time since request animation frame matches refresh rate
            // Right now the elapsed is ~2ms after the actual desired start time
            if (!this.songStarted && timelineSecondsElapsed >= this.songStartSeconds) {
                console.log('Resuming song after', timelineSecondsElapsed)
                this.spotifyPlayer.resume()
                this.songStarted = true
            }

            this.scheduleUpcomingClicks(timelineSecondsElapsed)

            requestAnimationFrame(this.animFrameLoop)
        },
        seekSong() {
            let seekTime = this.seekOffsetSeconds - this.songStartSeconds
            let seekTimeMs = seekTime * 1000
            this.spotifyPlayer.seek(Math.max(0, seekTimeMs))
        },
        stopSong() {
            this.songStarted = false
            this.spotifyPlayer.pause()
        },


        scheduleUpcomingClicks(timelineSecondsElapsed) {
            // Negative bump to pre-empt t=0 click, fix later
            let windowBegin = timelineSecondsElapsed - CLICK_LOOKAROUND
            let windowEnd = timelineSecondsElapsed + CLICK_LOOKAROUND

            for (let index = this.nextEvent; index < this.clickEventTimeline.length; index++) {
                let event = this.clickEventTimeline[index]
                if (event.time >= windowBegin && event.time < windowEnd) {
                    console.log('Scheduling click', event.time)
                    this.scheduleClick(event.time, timelineSecondsElapsed)
                    // Don't need to schedule this event in the next loop, only process remaining
                    this.nextEvent = index + 1
                }

                // Remaining events are not ready to be scheduled
                if (event.time >= windowEnd) {
                    break
                }
            }
        },
        scheduleClick(time, timelineSecondsElapsed) {
            let osc = this.audioContext.createOscillator()
            osc.frequency.value = 220
            osc.connect(this.audioContext.destination)

            // Floor at 0 for the very first click
            let secondsTillClick = Math.max(0, time - timelineSecondsElapsed)
            let clickStart = this.audioContext.currentTime + secondsTillClick
            osc.start(clickStart)
            osc.stop(clickStart + 0.025)
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
