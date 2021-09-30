import { CLIENT_ID, REDIRECT_URI, CODE_VERIFIER_KEY } from '@/auth/auth.json'

export function authorizationQueryParameters(codeChallenge) {
    return {
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    }

}

export function tokenEndpointBody(authCode) {
    return {
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: REDIRECT_URI,
        code_verifier: getCodeVerifier(),
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
