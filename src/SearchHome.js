import React, { Component } from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import './index.css';
import './SearchHomeStyle.css';


const styles = {
  customWidth: {
    width: 150,
  },
};

class SearchHome extends Component {
    
 state = {
    value: 1,
  };

  handleChange = (event, index, value) => this.setState({value});
    render() {
        return (
            <div className="centered container">
            <p>It's Lit Fam</p>
            <SelectField 
            floatingLabelText="Select Mood"
            value={this.state.value}
            onChange={this.handleChange}
            autoWidth={true}
            >
                <MenuItem value={1} primaryText="Happy" />
                <MenuItem value={2} primaryText="Angry" />
                <MenuItem value={3} primaryText="Calm" />
                <MenuItem value={4} primaryText="Sad" />
                <MenuItem value={5} primaryText="Surprised" />
            </SelectField>
        </div>
        );
    }
}

export default SearchHome;