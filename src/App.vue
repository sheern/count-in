<template>
    <div id="app">
        <img width="150" height="150" alt="Vue logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png">
        <Login v-if="!token" />
        <Main v-else :token="token" :spotifyPlayer="spotifyPlayer" :spotifyApi="spotifyApi" />
    </div>
</template>

<script>
import Login from '@/components/Login.vue'
import Main from '@/components/Main.vue'

export default {
    name: 'App',
    components: {
        Login,
        Main,
    },
    props: ['spotifyPlayer', 'spotifyApi', 'token'],
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

#events {
    text-align: left;
}
</style>
