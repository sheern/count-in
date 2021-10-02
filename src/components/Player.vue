<template>
    <div class="controls">
        <button v-on:click="onPlay">{{ playing ? 'Stop' : 'Play' }}</button>
        <button v-on:click="onReset">Reset</button>
        <button @click="previewMode = !previewMode">{{ previewMode ? "Exit preview mode" : "Preview mode" }}</button>
        <h5>Seek slider</h5>
        <!-- v-model doesn't seem to bind properly when set in a watch function (re-render happens before watch?) -->
        <!-- ACTUALLY when not touching start value, the component doesn't rerender even when leaving preview mode. WTF! -->
        <!-- Maybe have 2 separate sliders? 1 for seek time, other for preview range -->
        <vue-slider class="seek-slider" v-model="sliderValue" :interval="0.05" :max="300"
            :min-range="5" :max-range="50" :enable-cross="false" />
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { EventType } from '@/constants.js'

// Event loop frequency
const INTERVAL = 200
// Millis to look ahead when scheduling events
const LOOKAHEAD = INTERVAL * 1.25

export default {
    name: 'Player',
    components: {
        VueSlider,
    },
    props: ['spotifyPlayer', 'audioCtx', 'eventTimeline', 'songStartTime'],
    data() {
        return {
            playing: false,
            previewMode: false,
            sliderValue: 0,
            // The offset applied to elapsed time
            // This is non-zero when pausing the track or seeking to a point in the track
            seekOffsetSeconds: 0,

            // The time we use to schedule events
            audioCtxStartTime: 0,
            nextEvent: 0,
            // setTimeout id of the song resume
            songScheduleId: 0,
            // setTimeout id of the preview
            previewScheduleId: 0,
            // setTimeout id of the event loop
            eventLoopId: 0,
        }
    },
    watch: {
        previewMode(newPreviewMode) {
            // WTF without adjusting the start value of the slider, it doesn't react to the change from range to single
            // TODO file an issue
            let sliderValue = this.sliderValue
            if (newPreviewMode) {
                this.sliderValue = [sliderValue + 0.1, sliderValue + 10]
            }
            else {
                this.sliderValue = sliderValue[0] - 0.1
            }
        },
    },
    // TODO add a handler for seek slider release, update seekOffsetSeconds
    methods: {
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioCtx.resume()
                this.audioCtxStartTime = this.audioCtx.currentTime

                this.triggerEventLoop()
                if (this.previewMode) {
                    this.beginPreview()
                }
                else {
                    this.seekAndScheduleSong()
                }
            }
            else {
                // Maintain track position so user can resume
                this.seekOffsetSeconds = this.secondsElapsed()
                this.stopSong()

                clearTimeout(this.previewScheduleId)
            }
        },
        onReset() {
            this.seekTo(0)
        },
        beginPreview() {
            this.audioCtxStartTime = this.audioCtx.currentTime
            this.seekTo(this.sliderValue[0])
            this.seekAndScheduleSong()

            if (this.playing) {
                let previewLength = this.sliderValue[1] - this.sliderValue[0]
                this.previewScheduleId = setTimeout(this.beginPreview, previewLength * 1000)
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



        // Scheduling events
        seekAndScheduleSong() {
            let delay = this.songStartTime - this.secondsElapsed()
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

            for (let index = this.nextEvent; index < this.eventTimeline.length; index++) {
                let event = this.eventTimeline[index]
                if (event.time >= windowBegin && event.time < windowEnd) {
                    this.scheduleEvent(event)
                    // Don't need to schedule this event in the next loop, only process remaining
                    this.nextEvent = index + 1
                }

                // Remaining events are not ready to be scheduled
                if (event.time >= windowEnd) {
                    break
                }
            }
        },
        scheduleEvent(event) {
            if (event.type === EventType.CLICK) {
                this.scheduleClick(event.time)
            }
        },
        scheduleClick(time) {
            let osc = this.audioCtx.createOscillator()
            osc.frequency.value = 440
            osc.connect(this.audioCtx.destination)

            // Floor at 0 for the very first click
            let secondsTillClick = Math.max(0, time - this.secondsElapsed())
            let clickStart = this.audioCtx.currentTime + secondsTillClick
            osc.start(clickStart)
            osc.stop(clickStart + 0.05)
        },

        secondsElapsed() {
            return this.seekOffsetSeconds + (this.audioCtx.currentTime - this.audioCtxStartTime)
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
