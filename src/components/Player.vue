<template>
    <div id="controls">
        <button v-on:click="onPlay">{{ playingText }}</button>
        <button v-on:click="onReset">Reset</button>
        <h5>Seek slider</h5>
        <button @click="loopMode = !loopMode">{{ loopMode ? "Exit loop mode" : "Loop mode" }}</button>
        <!-- v-model doesn't seem to bind properly when set in a watch function (re-render happens before watch?) -->
        <!-- ACTUALLY when not touching start value, the component doesn't rerender even when leaving loop mode. WTF! -->
        <!-- Maybe have 2 separate sliders? 1 for seek time, other for preview range -->
        <vue-slider v-model="sliderValue" :interval="0.05" :max="300"
            :max-range="50" :enable-cross="false" />
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { EventType } from '../constants.js'

// Event loop frequency
const INTERVAL = 75
// Millis to look ahead when scheduling events
const LOOKAHEAD = INTERVAL * 1.25

export default {
    name: 'Player',
    components: {
        VueSlider,
    },
    props: ['spotifyPlayer', 'audioCtx', 'eventTimeline'],
    data() {
        return {
            playing: false,
            loopMode: false,
            // The time we use to schedule events
            audioCtxStartTime: 0,
            nextEvent: 0,
            sliderValue: 0,
            // The offset applied to elapsed time
            // This is non-zero when pausing the track or seeking to a point in the track
            seekOffsetSeconds: 0,
            songScheduleId: 0,
        }
    },
    watch: {
        loopMode(newLoopMode) {
            // WTF without adjusting the start value of the slider, it doesn't react to the change from range to single
            // TODO file an issue
            let sliderValue = this.sliderValue
            if (newLoopMode) {
                this.sliderValue = [sliderValue + 0.1, sliderValue + 10]
            }
            else {
                this.sliderValue = sliderValue[0] - 0.1
            }
        },
    },
        playingText() { return this.playing ? 'Stop' : 'Play' },
    },
    methods: {
        onPlay() {
            this.playing = !this.playing

            if (this.playing) {
                this.audioCtx.resume()
                this.audioCtxStartTime = this.audioCtx.currentTime

                this.seekOffsetSeconds = this.sliderValue
                this.seekAndScheduleSong()
                this.eventLoop()
            }
            else {
                // Maintain track position so user can resume
                this.seekOffsetSeconds = this.secondsElapsed()
                this.stopSong()
            }
        },
        onReset() {
            this.stopSong()
            this.seekOffsetSeconds = 0
            this.nextEvent = 0
        },
        // TODO do this on a web worker thread to unclog main UI thread
        eventLoop() {
            this.scheduleUpcomingEvents()

            if (this.playing)
                setTimeout(this.eventLoop, INTERVAL)
        },

        // Scheduling events
        seekAndScheduleSong() {
            let eventTime = this.getSongStartEvent().time
            let delay = eventTime - this.secondsElapsed()
            let delayMs = delay * 1000
            // We are in the middle of the song, seek to however much we are past the start
            if (delayMs < 0)
                this.spotifyPlayer.seek(-delayMs)
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
                console.log(`Scheduling ${event.type} at ${event.time} (current time ${this.secondsElapsed()})`)
                this.scheduleClick(event.time)
            }
        },
        scheduleSong(time) {
            let delay = time - this.secondsElapsed()
            setTimeout(() => this.spotifyPlayer.resume(), delay * 1000)
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
        getSongStartEvent() {
            return this.eventTimeline.find(event => event.type === EventType.SONG_START)
        },
    },
}
</script>
