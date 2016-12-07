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
	render() {
		return (
			<div id="home">
				<p className="centered"><img src="./fire.png" alt="fire icon" className="fireBig" aria-hidden="true" />It's Lit Fam</p>
			</div>
		);
	}
}

export default SearchHome;