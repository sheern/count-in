import { v4 as uuid } from 'uuid'
import { EventType } from '@/constants'

export function computeSecondsPerClick(bpm) {
    return 60.0 / bpm
}

export function createClickTrack() {
    return {
        id: uuid(),         // Used as key in listing
        startTime: 0,      // Seconds relative to song start
        bpm: 120,
        count: 4,           // The number of clicks to play
    }
}

// TODO Array ordered by event.startTime
export function computeEventTimeline(clickTracks, songStartTime) {
    let eventTimeline = clickTracks.map(cl => createClickEventsForTrack(cl)).flat()
    eventTimeline.push(createSongStartEvent(songStartTime))
    return eventTimeline.sort((event1, event2) => event1.time - event2.time)
}

function createSongStartEvent(startTime) {
    return createEvent(EventType.SONG_START, startTime)
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
