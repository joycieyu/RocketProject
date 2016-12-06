import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, AutoComplete, GridList, GridTile, IconButton, RaisedButton, Slider, Subheader, Drawer, ListItem, List } from 'material-ui';
import AvPlayCircleFilled from 'material-ui/svg-icons/av/play-circle-outline';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SpotifyApi from 'spotify-web-api-js';
import SearchHome from './SearchHome';
import { goToSpotifyLogin, params } from './auth.js';
import _ from 'lodash';

import ReactDOM from 'react-dom';
import {Layer, Rect, Stage, Group} from "react-konva";
import Konva from "konva";

//import VisualPage from './Visualizer';

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
         valence: 0.5
      });
   }

   componentDidMount() {
      // if logged in, set access token
      if (params.access_token) {
         s.setAccessToken(params.access_token);
      }
   }

   // show list of songs returned by the search query
   refreshSongList = (data) => {
      console.log("what's data", data)
      this.setState({
         songList: data.tracks
      });

      console.log("hello", this.state);

      //console.log(this.state);

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

   render() {
      return (
         <div>
            <Nav refreshSongList={this.refreshSongList} userFeatureValue={this.state} />
            <div className="container">
               {this.state.songList.length === 0 &&
                  <SearchHome />
               }
               {_.isEmpty(params) &&
                  <RaisedButton label="Login with Spotify to continue" primary={true} onTouchTap={() => goToSpotifyLogin()} />
               }
							 <MyRect/>
               <Subheader>Danceability</Subheader>

               <Slider
                  defaultValue={0.5}
                  value={this.state.danceability}
                  onChange={this.handleDanceability}
                  />
               <Subheader>Energy</Subheader>
               <Slider
                  defaultValue={0.5}
                  value={this.state.energy}
                  onChange={this.handleEnergy}
                  />
               <Subheader>Loudness</Subheader>
               <Slider
                  defaultValue={-30}
                  min={-60}
                  max={0}
                  value={this.state.loudness}
                  onChange={this.handleLoudness}
                  />
               <Subheader>Tempo</Subheader>
               <Slider
                  min={60}
                  max={180}
                  defaultValue={120}
                  value={this.state.tempo}
                  onChange={this.handleTempo}
                  />
               <Subheader>Valence</Subheader>
               <Slider
                  defaultValue={0.5}
                  value={this.state.valence}
                  onChange={this.handleValence}
                  />
               {this.state.songList.length > 0 &&
                  <SongList songList={this.state.songList} nowPlaying={this.state.nowPlaying} updateParent={this.updateNowPlaying} />
               }
            </div>
            {this.state.nowPlaying.length > 0 &&
               <AudioPlayer autoplay style={styles.audioPlayerStyle} playlist={this.state.nowPlaying} />
            }
         </div>
      );
   }
}

class MyRect extends React.Component {
    constructor() {
      super();
      this.state = {
        color: 'green'
      };
      this.handleClick = this.handleClick.bind(this);
    }
    handleClick(event) {
      this.setState({
        color: Konva.Util.getRandomColor()
      });
			
			
    }
    render() {
        return (
					<Stage width={700} height={100} >
						<Layer>
            <Rect
                x={10} y={10} width={650} height={50}
                fill={this.state.color}
                shadowBlur={10}
								onClick={this.handleClick}
            />	
							</Layer>
						</Stage>
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
      this.setState({ inputValue: inputValue });
   }

   // search for songs
   onNewRequest = (query) => {
      console.log("all state", this.props);
      s.getMyTopTracks()
         .then((data) => {
            var trackSeed = data.items[0].id;
            s.getRecommendations({ seed_tracks:trackSeed, limit: 50, target_loudness: this.props.userFeatureValue.loudness, target_tempo: this.props.userFeatureValue.tempo, 
                                    target_valence: this.props.userFeatureValue.valence, target_energy: this.props.userFeatureValue.energy, target_danceability: this.props.userFeatureValue.danceability })
               .then((recommendedSongObject) => {
                  console.log("here it is", recommendedSongObject);
                  this.props.refreshSongList(recommendedSongObject);
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
      this.state = { open: false };
   }

   handleToggle = () => this.setState({ open: !this.state.open });
   render() {
      var songCards = this.props.songList.map((song, index) => {
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name}
            actionIcon={<IconButton onTouchTap={() => this.props.updateParent(song)}><AvPlayCircleFilled color={cyan50} /></IconButton>}>
            <img src={song.album.images[0].url} alt="album art" />
         </GridTile>

      });
      var nowPlayingPlaylist = this.props.nowPlaying.map((song, index) => {
         console.log(song);
         return <ListItem key={index} disabled nestedListStyle={{ backgroundColor: "black", opacity: "0.3" }} primaryText={song.displayText} />
      });

      return (
         <div>
            <RaisedButton label="Toggle Drawer" onTouchTap={this.handleToggle} />
            <Drawer width={300} openSecondary={true} open={this.state.open} >
               <List>
                  <Subheader>NowPlaying</Subheader>
                  {nowPlayingPlaylist}
               </List>
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

export default App;