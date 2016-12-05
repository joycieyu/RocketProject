import React, { Component } from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import { AutoComplete }   from 'material-ui';
import './SearchHomeStyle.css';


const styles = {
  customWidth: {
    width: 150,
  },
};

class SearchHome extends Component {
    
  constructor(props) {
    super(props);

    this.state = {
      dataSource: [],
    };
  }

  handleChange = (event, index, value) => this.setState({value});
    render() {
        return (
        <div className="centered container">
            <p>It's Lit Fam</p>
             <AutoComplete hintText="Type your mood here..." 
                     dataSource={this.state.dataSource} 
                     onUpdateInput={this.onUpdateInput} 
                     onNewRequest={this.onNewRequest}
                  />
        </div>
        );
    }
}

export default SearchHome;