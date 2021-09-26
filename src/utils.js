import { v4 as uuid } from 'uuid'

export function computeSecondsPerClick(bpm) {
    return 60.0 / bpm
}

export function createClickTrack() {
    return {
        id: uuid(),         // Used as key in listing
        startTime: -2,      // Seconds relative to song start
        bpm: 120,
        count: 4,           // The number of clicks to play
    }
}

// TODO Array ordered by event.startTime
export function computeEventTimeline(clickTracks) {
    let offsetInSeconds = computeOffsetInSeconds(clickTracks)
    let eventTimeline = clickTracks.map(cl => createClickEventsForTrack(cl, offsetInSeconds)).flat()
    eventTimeline.push(createSongStartEvent(offsetInSeconds))
    return eventTimeline.sort((event1, event2) => event1.time - event2.time)
}

function createSongStartEvent(startTime) {
    return createEvent('SONG_START', startTime)
}

function createClickEventsForTrack(clickTrack, offsetInSeconds) {
    let secondsPerClick = computeSecondsPerClick(clickTrack.bpm)
    let absoluteStartTime = clickTrack.startTime + offsetInSeconds
    let clickEvents = []
    for (let beat = 0; beat < clickTrack.count; beat++) {
        clickEvents.push(createEvent('CLICK', absoluteStartTime + (beat * secondsPerClick)))
    }
    return clickEvents
}

function createEvent(type, time) {
    return {
        id: uuid(),
        type,
        time,
    }
}

// In practice, the earliest click track before the song starts should be t=0 in the timeline
// since the audio context can't schedule a negative time.
// This returns the positive number of seconds to shift all clicks and the song.
// If no clicks exist before the song starts, then there is no need to offset.
function computeOffsetInSeconds(clickTracks) {
    return -Math.min(...clickTracks.map(cl => cl.startTime))
}
