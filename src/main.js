import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

const app = new Vue({
    render(h) {
        return h(App, {
            props: {
                spotify: this.spotify
            }
        });
    },
    data: {
        spotify: null
    }
});

// Load Spotify player into Vue app instance
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Loaded Spotify');
    const token = 'BQDXE0EMMEMmyd6ilgEabNkx1DdrG7z46ik61a3sUzF1ReMiOkNcySbxuYuZXq0JG3lqMLHNm6nfJI2MldtGQ6HRj3BufF_LGrUINUIaerouJ21uwM6A8E4oCG984r3_huoLVEwYqQs6v4mRN8QMDL2T5OolCFE';
    app.spotify = new window.Spotify.Player({
        name: 'Count In',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5,
    });
};

app.$mount('#app');
