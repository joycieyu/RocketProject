import React, { Component } from 'react';
import AudioPlayer from 'react-responsive-audio-player';
import { AppBar, AutoComplete, GridList, GridTile, IconButton, Subheader }   from 'material-ui';
import AvPlayCircleFilled from 'material-ui/svg-icons/av/play-circle-outline';
import { cyan50 } from 'material-ui/styles/colors';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import FetchController from './FetchController';
import SearchHome from './SearchHome';
//import VisualPage from './Visualizer';

injectTapEventPlugin();

class App extends Component {
   constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         nowPlaying: []
      });
   }

   // show list of songs returned by the search query
   refreshSongList = (data) => {
      console.log(data.tracks.items);
      this.setState({songList: data.tracks.items});
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
      FetchController.fetchData('https://api.spotify.com/v1/search?type=track&q='+query)
      .then((data) => {
         this.props.refreshSongList(data);
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
                  <img src={song.album.images[1].url} />
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