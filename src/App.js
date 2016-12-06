import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, AutoComplete, GridList, GridTile, IconButton, RaisedButton, Subheader, Drawer, ListItem, List }   from 'material-ui';
import AvPlayCircleFilled from 'material-ui/svg-icons/av/play-circle-outline';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import SpotifyApi from 'spotify-web-api-js';
import SearchHome from './SearchHome';
import { goToSpotifyLogin, params } from './auth.js';
import _ from 'lodash';
//import Example from 
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
         console.log("next after", data)
      this.setState({
         songList: data.items,
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
            	{this.state.songList.length === 0 &&
                <SearchHome />
             }
             {_.isEmpty(params) && 
                <RaisedButton label="Login with Spotify to continue" className="centered" primary={true} onTouchTap={() => goToSpotifyLogin()}/>
             }
             {this.state.songList.length > 0 &&
                  <SongList songList={this.state.songList} updateParent={this.updateNowPlaying} playlist={this.state.nowPlaying}/>
             }       
             </div>
             {this.state.nowPlaying.length > 0 && 
                <AudioPlayer autoplay style={styles.audioPlayerStyle} playlist={this.state.nowPlaying}/> 
             }
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
         s.getRecommendations({limit:50,min_tempo:140,target_energy:0.6})
         .then((data) => {
               console.log("songobc",data);
      //        var idMap = data.albums.items.map((song) => {
      //              //console.log("id",song.id);
      //             return song.id;
      //             //return testing;
      //        })
      // //       s.getAudioFeaturesForTracks(idMap)
      // //        .then((audioFeatureData) => {
      // //             //console.log("here it is",audioFeatureData);
      // //             this.props.refreshSongList(testing, audioFeatureData);
      // //        })
      // // uncomment here     });
      // //    //})
      //    s.getAudioFeaturesForTracks(idMap)
      //    .then((audioFeatureData) => {
      //          console.log("here it is",audioFeatureData);
      //       this.props.refreshSongList(data, audioFeatureData);
      //    })
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
                        <a href="/#"><img src="./fire.png" alt="fire icon" height="42" width="42" />
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
    this.state = {open: false};
  }

  handleToggle = () => this.setState({open: !this.state.open});
   render() {
      var songCards = this.props.songList.map((song, index) => {
            console.log("pre error",song);
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name} 
            actionIcon={<IconButton onTouchTap={() => this.props.updateParent(song)}><AvPlayCircleFilled color={cyan50}/></IconButton>}>
                  <img src={song.album.images[1].url} alt="album art" />
         </GridTile>
      
      });
      var nowPlayingPlaylist = this.props.playlist.map((song, index) => {
            return <ListItem key={index} disabled nestedListStyle={{backgroundColor: "black", opacity:"0.3"}} primaryText={song.displayText} />
      });

      return (
         <div>
            <RaisedButton label="Toggle Drawer" onTouchTap={this.handleToggle}/>
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