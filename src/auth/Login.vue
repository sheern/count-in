<template>
    <div>
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
