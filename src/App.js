import React, { Component } from 'react';
import { AppBar, AutoComplete, GridList, GridTile, Subheader }   from 'material-ui';
import styles from './styles.js';
import injectTapEventPlugin from 'react-tap-event-plugin';
import FetchController from './FetchController';

injectTapEventPlugin();

class App extends Component {
   constructor(props) {
      super(props);
      this.state = ({
         songList: []
      });
   }

   refreshSongList = (data) => {
      console.log(data.tracks.items);
      this.setState({songList: data.tracks.items});
   }

   render() {
      return (
         <div>
            <Nav refreshSongList={this.refreshSongList}/>
            <div className="container">
            {
               this.state.songList.length > 0 &&
               <SongList songList={this.state.songList}/>
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
               style={styles.AppBarStyle}
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
         return <GridTile key={index} title={song.name} subtitle={song.artists[0].name} >
                  <img src={song.album.images[1].url} />
         </GridTile>
      });

      return (
         <div>
            <GridList
               cellHeight={180}
            >
            <Subheader>Results</Subheader>
            {songCards}
            </GridList>
         </div>
      );
   }
}

export default App;