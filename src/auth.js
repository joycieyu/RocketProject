var stateKey = 'spotify_auth_state';

/**
* Obtains parameters from the hash of the URL
* @return Object
*/
function getHashParams() {
   var hashParams = {};
   var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
   while (e = r.exec(q)) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
   }
   return hashParams;
}

/**
* Generates a random string containing numbers and letters
* @param  {number} length The length of the string
* @return {string} The generated string
*/
function generateRandomString(length) {
   var text = '';
   var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

   for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   }
   return text;
};

var params = getHashParams();

var access_token = params.access_token,
   state = params.state,
   storedState = localStorage.getItem(stateKey);

if (access_token && (state == null || state !== storedState)) {
   // alert('There was an error during the authentication');
} else {
   localStorage.removeItem(stateKey);
}

var goToSpotifyLogin = () => {
   var client_id = 'b4157a6471104362b9205add6f5b5621';
   var redirect_uri = 'http://localhost:3000/';

   var state = generateRandomString(16);

   localStorage.setItem(stateKey, state);
   var scope = 'user-top-read playlist-read-private'

   var url = 'https://accounts.spotify.com/authorize';
   url += '?response_type=token';
   url += '&client_id=' + encodeURIComponent(client_id);
   url += '&scope=' + encodeURIComponent(scope);
   url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
   url += '&state=' + encodeURIComponent(state);

   window.location = url;
}

export { goToSpotifyLogin, params };