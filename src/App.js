import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, Dialog, FlatButton, GridList, GridTile, IconButton, IconMenu, RaisedButton, Slider, Subheader, Drawer, Menu, MenuItem, Popover } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import AvAddCircleOutline from 'material-ui/svg-icons/av/playlist-add.js';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SpotifyApi from 'spotify-web-api-js';
import SearchHome from './SearchHome';
import { goToSpotifyLogin, params } from './auth.js';
import _ from 'lodash';

injectTapEventPlugin();
var s = new SpotifyApi();

class App extends Component {
   constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         nowPlaying: [],
         nowPlayingUri: [],
         danceability: 0.5,
         energy: 0.5,
         loudness: -30,
         tempo: 120,
         valence: 0.5,
         dataSource: [],
         inputValue: "",
         loginOpen: false,
         nextImage: "background0",
         playlistOpen: false,
         openPopOver: false
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

   // get song recommendations based on user's listening history and slider values
   generateFireMixtape = () => {
      if (!_.isEmpty(params)) {
         s.getMyTopTracks()
            .then((data) => {
               var trackSeed = data.items[0].id;
               s.getRecommendations({
                  seed_tracks: trackSeed, target_loudness: this.state.loudness, target_tempo: this.state.tempo,
                  target_valence: this.state.valence, target_energy: this.state.energy, target_danceability: this.state.danceability
               })
                  .then((recommendedSongObject) => {
                     this.setState({ sliderDrawerOpen: false });
                     this.refreshSongList(recommendedSongObject);
                  })
            })
      } else {
         this.setState({ loginOpen: true });
      }
   }

   handleTouchTap = () => {
      // This prevents ghost click.
      event.preventDefault();

      this.setState({
         openPopover: true,
         anchorEl: event.currentTarget,
      });
   };

   handleRequestClose = () => {
      this.setState({
         openPopover: false,
      });
   };

   // add a new song to the playlist
   updateNowPlaying = (song) => {
      this.setState({
         nowPlaying: this.state.nowPlaying.concat([{
            url: song.preview_url,
            displayText: song.name + ' - ' + song.artists[0].name
         }]),
         nowPlayingUri: this.state.nowPlayingUri.concat([song.uri]),
         playlistDrawerOpen: true
      });
   }

   // change currently playing song in the playlist
   changeSong = (event, value) => {
      var ref = this.refs.playerRef;
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

   // add the current playlist to the user's Spotify account
   createPlaylist = () => {
      s.getMe()
         .then((user) => {
            s.createPlaylist(user.id, { name: "My Fire Mixtape" })
               .then((playlist) => {
                  s.addTracksToPlaylist(user.id, playlist.id, this.state.nowPlayingUri)
                     .then(() => { this.setState({ playlistOpen: true }) })
               })
         })
   }

   handleDanceability = (event, value) => this.setState({ danceability: value });

   handleEnergy = (event, value) => this.setState({ energy: value });

   handleLoudness = (event, value) => this.setState({ loudness: value });

   handleTempo = (event, value) => this.setState({ tempo: value });

   handleValence = (event, value) => this.setState({ valence: value });

   handleLoginClose = () => this.setState({ loginOpen: false });

   handlePlaylistClose = () => this.setState({ playlistOpen: false });

   handleSliderDrawerToggle = () => this.setState({ sliderDrawerOpen: !this.state.sliderDrawerOpen });

   handlePlaylistDrawerToggle = () => this.setState({ playlistDrawerOpen: !this.state.playlistDrawerOpen });

   handleTouchTap = (event) => {
      // This prevents ghost click.
      event.preventDefault();

      this.setState({
         openPopOver: true,
         anchorEl: event.currentTarget,
      });
   };

   handleRequestClose = () => {
      this.setState({
         openPopOver: false,
      });
   };

   // change background image
   handleClick(event, num) {
      this.setState({
         nextImage: num
      });
   };
   render() {
      var nowPlayingPlaylist = this.state.nowPlaying.map((song, index) => {
         return <MenuItem style={styles.titleStyling} key={index} primaryText={song.displayText} value={index} />
      });

      return (
         <div className="test" id={this.state.nextImage}>
            {/* Fire icon link at top */}
            {this.state.songList.length > 0 &&
               <Nav sliderDrawerToggle={this.handleSliderDrawerToggle} playlistDrawerToggle={this.handlePlaylistDrawerToggle} />
            }
            {this.state.songList.length > 0 &&
               <div className="centered top"><a id="addSong" href="#songs">add songs to your <em>lit</em> playlist below</a></div>
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
               {/* Sliders for adjusting preferred music parameters */}
               {this.state.songList.length === 0 &&
                  <div>
                     <div className="container sliders">
                        <Subheader style={styles.subHeaderStyle}>How much do you want to dance?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.danceability}
                           onChange={this.handleDanceability}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader style={styles.subHeaderStyle}>How pumped are you?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.energy}
                           onChange={this.handleEnergy}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader style={styles.subHeaderStyle}>How loud do you want your music?</Subheader>
                        <Slider
                           defaultValue={-30}
                           min={-60}
                           max={0}
                           value={this.state.loudness}
                           onChange={this.handleLoudness}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader style={styles.subHeaderStyle}>How fast do you want the beat?</Subheader>
                        <Slider
                           min={60}
                           max={180}
                           defaultValue={120}
                           value={this.state.tempo}
                           onChange={this.handleTempo}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader style={styles.subHeaderStyle}>How happy do you want your tunes?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.valence}
                           onChange={this.handleValence}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                     </div>

                     <div className="centered">
                        <RaisedButton label="Generate Fire Mixtape" primary={true} style={styles.buttonStyle}
                           onTouchTap={this.generateFireMixtape} />
                     </div>
                  </div>
               }
               {this.state.songList.length > 0 &&
                  <div className="pushDown">
                     <Drawer docked={false} openSecondary={true} width={300} open={this.state.sliderDrawerOpen} onRequestChange={(open) => this.setState({ sliderDrawerOpen: false })} >
                        <Subheader style={styles.lightDrawerHeaderStyle}>What would you like?</Subheader>
                        <Subheader>How much do you want to dance?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.danceability}
                           onChange={this.handleDanceability}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader>How pumped are you?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.energy}
                           onChange={this.handleEnergy}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader>How loud do you want your music?</Subheader>
                        <Slider
                           defaultValue={-30}
                           min={-60}
                           max={0}
                           value={this.state.loudness}
                           onChange={this.handleLoudness}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader>How fast do you want the beat?</Subheader>
                        <Slider
                           min={60}
                           max={180}
                           defaultValue={120}
                           value={this.state.tempo}
                           onChange={this.handleTempo}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <Subheader>How happy do you want your tunes?</Subheader>
                        <Slider
                           defaultValue={0.5}
                           value={this.state.valence}
                           onChange={this.handleValence}
                           style={styles.rootSliderStyle}
                           sliderStyle={styles.sliderStyle}
                           />
                        <div className="centered">
                           <RaisedButton label="Generate Fire Mixtape" primary={true} style={styles.buttonStyle}
                              onTouchTap={this.generateFireMixtape} />
                        </div>
                     </Drawer>
                  </div>
               }
               {/* Options for changing background and adding a playlist to Spotify */}
               {this.state.songList.length > 0 &&
                  <div className="centered">
                     <RaisedButton className="space"
                        onTouchTap={this.handleTouchTap}
                        label="Not feelin' the animation?"
                        backgroundColor="orange"
                        style={styles.buttonStyle}
                        />
                     <Popover
                        open={this.state.openPopOver}
                        anchorEl={this.state.anchorEl}
                        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                        onRequestClose={this.handleRequestClose}
                        >
                        <Menu>
                           <MenuItem primaryText="Harbour" onTouchTap={(event) => this.handleClick(event, "background0")} />
                           <MenuItem primaryText="Final Fantasy" onTouchTap={(event) => this.handleClick(event, "background1")} />
                           <MenuItem primaryText="Light Blubs" onTouchTap={(event) => this.handleClick(event, "background2")} />
                           <MenuItem primaryText="Leaves" onTouchTap={(event) => this.handleClick(event, "background3")} />
                        </Menu>
                     </Popover>
                     <RaisedButton
                        onTouchTap={this.createPlaylist}
                        label="Add this playlist to Spotify"
                        backgroundColor="orange"
                        style={styles.buttonStyle}
                        />
                  </div>
               }
               {/* Now playing drawer and generated list of songs */}
               {this.state.songList.length > 0 &&
                  <div>
                     <Drawer docked={false} openSecondary={true} width={300} open={this.state.playlistDrawerOpen} onRequestChange={(open) => this.setState({ playlistDrawerOpen: false })} >
                        <Subheader style={styles.lightDrawerHeaderStyle}>Now Playing</Subheader>
                        <Menu onChange={this.changeSong}>
                           {nowPlayingPlaylist}
                        </Menu>
                     </Drawer>
                     <SongList songList={this.state.songList} nowPlaying={this.state.nowPlaying} updateParent={this.updateNowPlaying} playlistDrawerToggle={this.handlePlaylistDrawerToggle}/>
                  </div>
               }
            </div>

            {this.state.nowPlaying.length > 0 &&
               <AudioPlayer autoplay ref="playerRef" style={styles.audioPlayerStyle} playlist={this.state.nowPlaying} />
            }
            {/* Combination of all used dialogs */}
            <Dialogs loginOpen={this.state.loginOpen} loginClose={this.handleLoginClose} playlistOpen={this.state.playlistOpen} playlistClose={this.handlePlaylistClose} />
            <div className="container">
               <footer>
                  <p> made by team rocket </p>
               </footer>
            </div>
         </div>
      );
   }
}

class Nav extends Component {

   logout = () => {
      location.reload();
   }

   render() {
      return (
         <div>
            <AppBar
               title="It's Lit Fam"
               style={styles.appBarStyle}
               iconElementLeft={
                  <a href="#" aria-hidden="true"><img src="./fire.png" alt="fire icon" className="fireSmall" />
                  </a>
               }
               iconElementRight={
                  <IconMenu
                     iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                     targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                     anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                     >
                     <MenuItem primaryText="Logout" onTouchTap={this.logout} />
                     <MenuItem primaryText="Regenerate new mixtape" onTouchTap={this.props.sliderDrawerToggle} />
                     <MenuItem primaryText="See current playlist" onTouchTap={this.props.playlistDrawerToggle} />
                  </IconMenu>
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
      };
   }

   addToPlaylist = (song) => {
      this.props.playlistDrawerToggle();
      this.props.updateParent(song);
   }

   render() {
      var songCards = this.props.songList.map((song, index) => {
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name}
            actionIcon={<IconButton onTouchTap={() => this.addToPlaylist(song)}><AvAddCircleOutline color={cyan50} /></IconButton>}>
            <img src={song.album.images[0].url} alt="album art" />
         </GridTile>

      });

      return (
         <div id="songs">
            <GridList
               cellHeight={180}
               style={styles.songListStyle}
               >
               <Subheader style={styles.resultsStyle}>Results</Subheader>
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
      const playlistActions = [
         <FlatButton
            label="Okay"
            primary={true}
            onTouchTap={this.props.playlistClose}
            />
      ];
      return (
         <div>
            <Dialog
               title="Hold up, fam"
               actions={loginActions}
               modal={false}
               open={this.props.loginOpen}
               onRequestClose={this.props.loginClose}
               >
               You need to login with your Spotify account.
         </Dialog>
            <Dialog
               title="Gotchu fam"
               actions={playlistActions}
               modal={false}
               open={this.props.playlistOpen}
               onRequestClose={this.props.playlistClose}
               >
               Check out your Spotify account for your new fire mixtape!
         </Dialog>
         </div>
      );
   }
}

export default App;