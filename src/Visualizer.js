import React, { Component } from 'react';

class VisualPage extends Component {
 constructor(props) {
      super(props);
      this.state = ({
         songList: [],
         nowPlaying: []
      });
   }
    render() {
        return (
            <div className="container">
                <div>
                    {this.state.songList.length > 0 &&
                    <SongList songList={this.state.songList} updateParent={this.updateNowPlaying}/>
                    }
                </div>
                {this.state.nowPlaying.length > 0 && 
                <AudioPlayer autoplay style={styles.audioPlayerStyle} playlist={this.state.nowPlaying}/>  
                }
            </div>
        );
    }
}