<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <div></div>
    <button v-on:click="onPlay">{{ playingText }}</button>
    <ClickTracks msg="My name is Shaan" />
  </div>
</template>

<script>
import ClickTracks from './components/ClickTracks.vue'

export default {
    name: 'App',
    components: {
        ClickTracks
    },
    props: ['spotify'],
    data() {
        return {
            playing: false,
        };
    },
    computed: {
        playingText: function() { return this.playing ? 'Stop' : 'Play'; },
    },
    methods: {
        onPlay: function() { this.playing = !this.playing; },
        onReset: function() { this.spotify.seek(0); },
    }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
