import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, Dialog, FlatButton, GridList, GridTile, IconButton, RaisedButton, Slider, Subheader, Drawer, ListItem, List, Menu, MenuItem } from 'material-ui';
import AvPlayCircleFilled from 'material-ui/svg-icons/av/play-circle-outline';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SpotifyApi from 'spotify-web-api-js';
import SearchHome from './SearchHome';
import { goToSpotifyLogin, params } from './auth.js';
import _ from 'lodash';
import { Layer, Rect, Stage, Group } from "react-konva";
import Konva from "konva";

injectTapEventPlugin();
var s = new SpotifyApi();

class App extends Component {
   constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         nowPlaying: [],
         danceability: 0.5,
         energy: 0.5,
         loudness: -30,
         tempo: 120,
         valence: 0.5,
         dataSource: [],
         inputValue: "",
         loginOpen: false
      });
   }

   componentDidMount() {
      // if logged in, set access token
      if (params.access_token) {
         s.setAccessToken(params.access_token);
      }
   }

    onUpdateInput = (inputValue) => {
    this.setState({ inputValue: inputValue });
   }
   // show list of songs returned by the search query
   refreshSongList = (data) => {
      this.setState({
         songList: data.tracks
      });
   }
   generateFireMixtape = () => {
      if (!_.isEmpty(params)) {
         s.getMyTopTracks()
         .then((data) => {
            var trackSeed = data.items[0].id;
            s.getRecommendations({ seed_tracks:trackSeed, limit: 50, target_loudness: this.state.loudness, target_tempo: this.state.tempo, 
                                    target_valence: this.state.valence, target_energy: this.state.energy, target_danceability: this.state.danceability })
            .then((recommendedSongObject) => {
               this.refreshSongList(recommendedSongObject);
            })
         })
      } else {
         this.setState({ loginOpen: true });
      }
   }


   // add a new song to the play list
   updateNowPlaying = (song) => {
      this.setState({
         nowPlaying: this.state.nowPlaying.concat([{
            url: song.preview_url,
            displayText: song.name + ' - ' + song.artists[0].name
         }])
      });
   }

   changeSong = (value) => {
      var ref = this.refs.playerRef;
      console.log(value);
      ref.audio.pause();
      ref.currentTrackIndex = value;
      ref.setState({ 
         activeTrackIndex: -1,
         displayedTime: 0
      }, () => {
         ref.updateSource();
         ref.togglePause(false);
      });
   }

   handleDanceability = (event, value) => {
      this.setState({ danceability: value });
   };

   handleEnergy = (event, value) => {
      this.setState({ energy: value });
   };

   handleLoudness = (event, value) => {
      this.setState({ loudness: value });
   };

   handleTempo = (event, value) => {
      this.setState({ tempo: value });
   };

   handleValence = (event, value) => {
      this.setState({ valence: value });
   };

   handleLoginClose = () => {
      this.setState({ loginOpen: false });
   }

   render() {
      return (
         <div>
            {this.state.songList.length > 0 &&
              <Nav refreshSongList={this.refreshSongList} userFeatureValue={this.state} />
            }
            <div className="container">
               {this.state.songList.length === 0 &&
                  <SearchHome />
               }
               {_.isEmpty(params) &&
                  <div className="centered">
                     <RaisedButton label="Login with Spotify to continue" primary={true} style={styles.buttonStyle}
                        onTouchTap={() => goToSpotifyLogin()} />
                  </div>
               }

               {this.state.songList.length > 0 &&
							   <MyRect/>
               }
               <Subheader>Danceability</Subheader>
               <Slider
                  defaultValue={0.5}
                  value={this.state.danceability}
                  onChange={this.handleDanceability}
                  style={styles.rootSliderStyle}
                  sliderStyle={styles.sliderStyle}
                  />
               <Subheader>Energy</Subheader>
               <Slider
                  defaultValue={0.5}
                  value={this.state.energy}
                  onChange={this.handleEnergy}
                  style={styles.rootSliderStyle}
                  sliderStyle={styles.sliderStyle}
                  />
               <Subheader>Loudness</Subheader>
               <Slider
                  defaultValue={-30}
                  min={-60}
                  max={0}
                  value={this.state.loudness}
                  onChange={this.handleLoudness}
                  style={styles.rootSliderStyle}
                  sliderStyle={styles.sliderStyle}
                  />
               <Subheader>Tempo</Subheader>
               <Slider
                  min={60}
                  max={180}
                  defaultValue={120}
                  value={this.state.tempo}
                  onChange={this.handleTempo}
                  style={styles.rootSliderStyle}
                  sliderStyle={styles.sliderStyle}
                  />
               <Subheader>Valence</Subheader>
               <Slider
                  defaultValue={0.5}
                  value={this.state.valence}
                  onChange={this.handleValence}
                  style={styles.rootSliderStyle}
                  sliderStyle={styles.sliderStyle}
                  />

               <div className="centered">
                  <RaisedButton label="Click Me To Make Your Lit Mixtape!" primary={true} style={styles.buttonStyle} 
                     onTouchTap={this.generateFireMixtape}/>
               </div>
               {this.state.songList.length > 0 &&
                  <SongList changeSong={this.changeSong} songList={this.state.songList} nowPlaying={this.state.nowPlaying} updateParent={this.updateNowPlaying} />
               }
            </div>
            {this.state.nowPlaying.length > 0 &&
               <AudioPlayer autoplay ref="playerRef" style={styles.audioPlayerStyle} playlist={this.state.nowPlaying} />
            }
            <Dialogs loginOpen={this.state.loginOpen} loginClose={this.handleLoginClose}/>

            <div className="container">
              <footer>
              <p> made by team rocket </p>
              </footer>
            </div>

            

         </div>
      );
   }
}

class MyRect extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        color: 'green'
      };
    }
    handleClick = (event) => {
      this.setState({
        color: Konva.Util.getRandomColor()
      });
			
    }
    render() {
        return (
          <div className="container centered">
            <Stage width={window.innerWidth / 2} height={100} >
               <Layer>
                  <Rect
                     x={10} y={10} width={window.innerWidth / 3} height={50}
                     fill={this.state.color}
                     shadowBlur={10}
                     onClick={(e) => this.handleClick(e)}
                  />
               </Layer>
            </Stage>
          </div>
        );
    }
}


class Nav extends Component {
   render() {
      return (
         <div>
            <AppBar
               title="It's Lit Fam"
               style={styles.appBarStyle}
               iconElementLeft={
                  <a href="/#" aria-hidden="true"><img src="./fire.png" alt="fire icon" className="fireSmall" />
                  </a>
               }
               />
         </div>
      );
   }
}

class SongList extends Component {
   constructor(props) {
      super(props);
      this.state = { 
         open: false,
         currentSong: 0
      };
   }

   handleToggle = () => this.setState({ open: !this.state.open });
   handleChange = (event, value) => {
      this.setState({ currentSong: value })
      this.props.changeSong(value);
   }
   render() {
      var songCards = this.props.songList.map((song, index) => {
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name}
            actionIcon={<IconButton onTouchTap={() => this.props.updateParent(song)}><AvPlayCircleFilled color={cyan50} /></IconButton>}>
            <img src={song.album.images[0].url} alt="album art" />
         </GridTile>

      });
      var nowPlayingPlaylist = this.props.nowPlaying.map((song, index) => {
         return <MenuItem key={index} primaryText={song.displayText} value={index} />
      });

      return (
         <div>
            <div className="centered"><RaisedButton label="Toggle Drawer" onTouchTap={this.handleToggle} style={styles.buttonStyle}/></div>
            <Drawer docked={false} width={300} open={this.state.open} onRequestChange={(open) => this.setState({open})} >
               <Subheader>Now Playing</Subheader>
               <Menu onChange={this.handleChange}>
                  {nowPlayingPlaylist}
               </Menu>
            </Drawer>

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

class Dialogs extends Component {
   render() {
      const loginActions = [
         <FlatButton
            label="Okay"
            primary={true}
            onTouchTap={this.props.loginClose}
         />
      ];
      return (
         <div>
            <Dialog
               title="Hold up fam"
               actions={loginActions}
               modal={false}
               open={this.props.loginOpen}
               onRequestClose={this.props.loginClose}
            >
            You need to login with your Spotify account.
            </Dialog>
         </div>
      );
   }
}

export default App;