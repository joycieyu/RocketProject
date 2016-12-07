import React, { Component } from 'react';
import './SearchHomeStyle.css';

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