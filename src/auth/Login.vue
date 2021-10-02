<template>
    <div>
        <img width="150" height="150" alt="Vue logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png">
        <div />
        <button @click="onLogin()">Log in</button>
    </div>
</template>

<script>
import pkceChallenge from 'pkce-challenge'
import { AUTHORIZATION_URL } from '@/auth/auth.json'
import { authorizationQueryParameters, setCodeVerifier } from '@/auth/utils'

export default {
    name: 'Login',
    methods: {
        onLogin() {
            const pkce = pkceChallenge()
            setCodeVerifier(pkce.code_verifier)

            const queryParams = authorizationQueryParameters(pkce.code_challenge)
            const authUrl = `${AUTHORIZATION_URL}?${new URLSearchParams(queryParams)}`

            window.location = authUrl
        },
    },
}
</script>

<style>

</style>
