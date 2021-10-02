import { v4 as uuid } from 'uuid'
import { EventType } from '@/constants'

export function computeSecondsPerClick(bpm) {
    return 60.0 / bpm
}

export function createClickTrack(startTime, bpm, count) {
    return {
        id: uuid(),         // Used as key in listing
        startTime,          // Seconds
        bpm,
        count,              // The number of clicks to play
    }
}

export function computeEventTimeline(clickTracks) {
    let eventTimeline = clickTracks.map(cl => createClickEventsForTrack(cl)).flat()
    return eventTimeline.sort((event1, event2) => event1.time - event2.time)
}

function createClickEventsForTrack(clickTrack) {
    let secondsPerClick = computeSecondsPerClick(clickTrack.bpm)
    let clickEvents = []
    for (let beat = 0; beat < clickTrack.count; beat++) {
        clickEvents.push(createEvent(EventType.CLICK, clickTrack.startTime + (beat * secondsPerClick)))
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
