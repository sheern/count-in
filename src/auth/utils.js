import { CLIENT_ID, SCOPES, CODE_VERIFIER_KEY } from '@/auth/auth.json'

export function authorizationQueryParameters(codeChallenge) {
    return {
        client_id: CLIENT_ID,
        scope: SCOPES,
        response_type: 'code',
        redirect_uri: process.env.VUE_APP_REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    }

}

export function tokenEndpointBody(authCode) {
    return {
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: process.env.VUE_APP_REDIRECT_URI,
        code_verifier: getCodeVerifier(),
    }
}

export function refreshTokenEndpointBody(refreshToken) {
    return {
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    }
}

export function setCodeVerifier(codeVerifier) {
    localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
}

export function unsetCodeVerifier() {
    localStorage.removeItem(CODE_VERIFIER_KEY)
}

export function getCodeVerifier() {
    return localStorage.getItem(CODE_VERIFIER_KEY)
}
