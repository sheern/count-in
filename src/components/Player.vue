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
            <v-btn :disabled="playing" @click="sectionMode = !sectionMode"
                rounded class="mx-1" :color="sectionMode ? 'primary' : ''">
                Section mode
            </v-btn>
            <v-spacer />
        </v-row>

        <v-row no-gutters class="px-4 pt-6">
            <v-slider :value="timelineSecondsElapsed" @end="onSeekBarRelease"
                :step="0.1" :max="timelineDuration"
                :label="formatMinutesAndSeconds(timelineSecondsElapsed)"
                nolabel
                thumb-label thumb-size="40"
                :disabled="playing">
                <template v-slot:append>
                    <v-fade-transition>
                        <v-text-field v-if="sectionMode" v-model="sectionDuration" type="number"
                            :rules="[ sectionDurationRule ]"
                            persistent-hint hint="Seconds" label="Section duration"
                            class="mt-0 pt-0" style="width: 100px">
                        </v-text-field>
                    </v-fade-transition>
                </template>
                <template v-slot:thumb-label="{ value: sliderSeconds }">
                    {{ formatMinutesAndSeconds(sliderSeconds) }}
                </template>
            </v-slider>
        </v-row>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { formatMinutesAndSeconds } from '@/utils'

const MIN_SECTION_DURATION = 3
// Millis to look ahead when scheduling clicks
const CLICK_LOOKAROUND = 50 / 1000.0

const EVENT_LOOP_NOT_STARTED = -1

export default {
    name: 'Player',
    data() {
        return {
            eventLoopStartTime: EVENT_LOOP_NOT_STARTED,
            timelineSecondsElapsed: 0,
            songStarted: false,

            playing: false,
            sectionMode: false,
            sectionDuration: MIN_SECTION_DURATION,
            sectionDurationRule(duration) {
                if (duration < MIN_SECTION_DURATION)
                    return `Must be at least ${MIN_SECTION_DURATION} seconds`
                return true
            },
            // The offset applied to elapsed time
            // This is non-zero when pausing the track or seeking to a point in the track
            seekOffsetSeconds: 0,

            nextEvent: 0,
            // setTimeout id of the section
            sectionScheduleId: 0,
        }
    },
    computed: {
        ...mapState([ 'audioContext', 'spotifyPlayer' ]),
        ...mapState('timeline', [ 'songStartSeconds' ]),
        ...mapGetters('timeline', [ 'clickEventTimeline', 'timelineDuration' ]),
    },
    methods: {
        formatMinutesAndSeconds,
        // TODO this doesn't do anything in section mode
        onSeekBarRelease(time) {
            this.playing = false
            this.seekTo(time)
            this.stopSong()
            clearTimeout(this.sectionScheduleId)

            console.log('Seek bar released', time)
        },
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioContext.resume()

                if (this.sectionMode) {
                    this.playSection()
                }
                else {
                    this.seekSong()
                }

                this.eventLoopStartTime = EVENT_LOOP_NOT_STARTED
                requestAnimationFrame(this.triggerEventLoop)
            }
            else {
                // Maintain track position so user can resume
                this.seekOffsetSeconds = this.timelineSecondsElapsed
                this.stopSong()

                clearTimeout(this.sectionScheduleId)
            }
        },
        playSection() {
            this.stopSong()

            this.seekTo(this.seekOffsetSeconds)
            this.seekSong()

            // This serves as a refresh flag for the event loop
            // The next time it is triggered, the start time will be set
            this.eventLoopStartTime = EVENT_LOOP_NOT_STARTED
            if (this.playing) {
                this.sectionScheduleId = setTimeout(this.playSection, this.sectionDuration * 1000)
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
        // This is most relevant to a click starting at t=0 (since play or section was started) since any
        //  subsequent click will be pre-empted
        // This suggestion essentially allows pre-empting the first click
        triggerEventLoop() {
            if (!this.playing) {
                this.stopSong()
                // Stop the event loop by no longer ticking on requestAnimationFrame
                return
            }

            const currentTime = this.audioContext.currentTime
            if (this.eventLoopStartTime === EVENT_LOOP_NOT_STARTED)
                this.eventLoopStartTime = currentTime

            const timelineSecondsElapsed = this.seekOffsetSeconds + (currentTime - this.eventLoopStartTime)
            this.timelineSecondsElapsed = timelineSecondsElapsed

            if (!this.songStarted && timelineSecondsElapsed >= this.songStartSeconds) {
                console.log('Resuming song after', timelineSecondsElapsed)
                this.resumeSong()
            }

            this.scheduleUpcomingClicks(timelineSecondsElapsed)

            requestAnimationFrame(this.triggerEventLoop)
        },


        seekSong() {
            let seekTime = this.seekOffsetSeconds - this.songStartSeconds
            let seekTimeMs = seekTime * 1000
            this.spotifyPlayer.seek(Math.max(0, seekTimeMs))
        },
        stopSong() {
            this.spotifyPlayer.pause()
            this.songStarted = false
        },
        resumeSong() {
            this.spotifyPlayer.resume()
            this.songStarted = true
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
