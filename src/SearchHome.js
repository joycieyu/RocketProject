import React, { Component } from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import './SearchHomeStyle.css';


const styles = {
  customWidth: {
    width: "100%",
  },
};

class SearchHome extends Component {
    
 state = {
    value: 1,
  };

  handleChange = (event, index, value) => this.setState({value});
    render() {
        return (
            <div id="home" className="container">
            <p className="centered"><img src="./fire.png" alt="fire icon" className="fireBig" aria-hidden="true"/>It's Lit Fam</p>
            
            <DropDownMenu
                value={this.state.value}
                onChange={this.handleChange}
                style={styles.customWidth}
                autoWidth={false}
            >
                <MenuItem value={1} primaryText="Happy" />
                <MenuItem value={2} primaryText="Angry" />
                <MenuItem value={3} primaryText="Calm" />
                <MenuItem value={4} primaryText="Sad" />
                <MenuItem value={5} primaryText="Surprised" />
            </DropDownMenu>      
        </div>
        );
    }
}

export default SearchHome;