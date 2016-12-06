import React from 'react';
import {Layer, Rect, Stage, Group, Konva} from 'react-konva';
 
class Example extends React.Component {
    constructor() {
      super();
      this.state = {
        color: 'green'
      };
      this.handleClick = this.handleClick.bind(this);
    }
    handleClick(event) {
      this.setState({
        color: Konva.Util.getRandomColor()
      });
      console.log(event, "clicked");
    }
    render() {
        return (
            <Rect
                x={10} y={10} width={50} height={50}
                fill={this.state.color}
                shadowBlur={10}
                onClick={this.handleClick(event)}
            />
        );
    }
}

export default Example;