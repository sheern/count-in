import { v4 as uuid } from 'uuid'

export function formatMinutesAndSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return minutes + ':' + seconds.toFixed(1).padStart(4, '0')
}

export function computeSecondsPerClick(bpm) {
    return 60.0 / bpm
}

export function createClickTrack(startTime, bpm, beats) {
    return {
        id: uuid(),         // Used as key in listing
        startTime,          // Seconds
        bpm,
        beats,              // The number of clicks to play
    }
}

// A sorted representation of the atomic click events that are
// computed from the blueprint click tracks passed in
export function computeClickEventTimeline(clickTracks) {
    let eventTimeline = clickTracks.map(cl => createClickEventsForTrack(cl)).flat()
    return eventTimeline.sort((event1, event2) => event1.time - event2.time)
}

function createClickEventsForTrack(clickTrack) {
    let secondsPerClick = computeSecondsPerClick(clickTrack.bpm)
    let clickEvents = []
    for (let beat = 0; beat < clickTrack.beats; beat++) {
        const time = clickTrack.startTime + (beat * secondsPerClick)
        clickEvents.push({ id: uuid(), time })
    }
    return clickEvents
}

