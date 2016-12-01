import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, AutoComplete, GridList, GridTile, IconButton, RaisedButton, Subheader }   from 'material-ui';
import AvPlayCircleFilled from 'material-ui/svg-icons/av/play-circle-outline';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SpotifyApi from 'spotify-web-api-js';
import SearchHome from './SearchHome';
import { goToSpotifyLogin, params } from './auth.js';
import _ from 'lodash';
//import VisualPage from './Visualizer';

injectTapEventPlugin();
var s = new SpotifyApi();

class App extends Component {
   constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         audioFeatureResults: {},
         nowPlaying: []
      });
   }

   componentDidMount() {
      // if logged in, set access token
      if (params.access_token) {
         s.setAccessToken(params.access_token);
      }
   }

   // show list of songs returned by the search query
   refreshSongList = (data, audioFeatureData) => {
      this.setState({
         songList: data.tracks.items,
         audioFeatureResults: audioFeatureData.audio_features
      });
      console.log(this.state);
   }

   // add a new song to the play list
   updateNowPlaying = (song) => {
      console.log(this.state.nowPlaying);
      this.setState({ 
         nowPlaying: this.state.nowPlaying.concat([{
            url: song.preview_url,
            displayText: song.name + ' - ' + song.artists[0].name
         }]) 
      });
   }

   render() {
      return (
         <div>
            <Nav refreshSongList={this.refreshSongList}/>
            <div className="container">
             <SearchHome />
             {_.isEmpty(params) && 
                <RaisedButton label="Login with Spotify to continue" primary={true} onTouchTap={() => goToSpotifyLogin()}/>
             }
             {this.state.songList.length > 0 &&
                  <SongList songList={this.state.songList} updateParent={this.updateNowPlaying}/>
             }              
             {this.state.nowPlaying.length > 0 && 
                <AudioPlayer autoplay style={styles.audioPlayerStyle} playlist={this.state.nowPlaying}/> 
             }
            </div>
         </div>
      );
   }
}
class Nav extends Component {
   constructor(props) {
      super(props);
      this.state = {
         dataSource: [],
         inputValue: ''
      }
   }

   onUpdateInput = (inputValue) => {
      this.setState({inputValue: inputValue});
   }

   // search for songs
   onNewRequest = (query) => {
      s.searchTracks(query)
      .then((data) => {
         console.log(data);
         var idMap = data.tracks.items.map((song) => {
            return song.id;
         });
         s.getAudioFeaturesForTracks(idMap)
         .then((audioFeatureData) => {
            this.props.refreshSongList(data, audioFeatureData);
         })
      })
   }

   render() {
      return (
         <div>
            <AppBar
               title="It's Lit Fam"
               style={styles.appBarStyle}
               iconElementRight={
                  <AutoComplete hintText="Type your mood here..." 
                     dataSource={this.state.dataSource} 
                     onUpdateInput={this.onUpdateInput} 
                     onNewRequest={this.onNewRequest}
                  />}
            />
         </div>
      );
   }
}

class SongList extends Component {
   render() {
      var songCards = this.props.songList.map((song, index) => {
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name} 
            actionIcon={<IconButton onTouchTap={() => this.props.updateParent(song)}><AvPlayCircleFilled color={cyan50}/></IconButton>}>
                  <img src={song.album.images[1].url} alt="album art" />
         </GridTile>
      });

      return (
         <div>
            <GridList
               cellHeight={180}
               style={styles.songListStyle}
            >
            <Subheader>Results</Subheader>
            {songCards}
            </GridList>
         </div>
      );
   }
}

export default App;