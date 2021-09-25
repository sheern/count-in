import { v4 as uuid } from 'uuid';

export function createClickTrack() {
    return {
        id: uuid(),         // Used as key in listing
        startTime: -2,      // Seconds relative to song start
        bpm: 120,
        clicks: 4,
    };
}

