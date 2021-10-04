import { computeClickEventTimeline } from '@/utils'

const state = {
    songStartSeconds: 2,
    clickTracks: [],
}

const getters = {
    clickEventTimeline(state) {
        return computeClickEventTimeline(state.clickTracks)
    },
}

const mutations = {
    setSongStartSeconds(state, { seconds }) {
        state.songStartSeconds = seconds
    },
    setClickTracks(state, { clickTracks }) {
        state.clickTracks = clickTracks
    },
    addClickTrack(state, { clickTrack }) {
        state.clickTracks.push(clickTrack)
    },
    removeClickTrack(state, { clickTrackId }) {
        const index = state.clickTracks.findIndex(track => track.id === clickTrackId)
        if (index !== -1) {
            state.clickTracks.splice(index, 1)
        }
    },
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
}
