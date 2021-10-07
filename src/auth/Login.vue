<template>
    <div>
        <v-img class="mx-auto" width="150" aspect-ratio="1" alt="Spotify logo"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/1024px-Spotify_logo_without_text.svg.png" />

        <v-container class="mt-2">
            <v-btn @click="onLogin()"
                rounded>
                Sign in
            </v-btn>
        </v-container>
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
