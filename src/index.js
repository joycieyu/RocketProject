import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'whatwg-fetch/fetch.js';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import 'normalize.css';
import 'react-responsive-audio-player/dist/audioplayer.css';
import './index.css';

ReactDOM.render(
   <MuiThemeProvider>
      <App />
   </MuiThemeProvider>,
   document.getElementById('root')
);
