import createReactClass from "create-react-class";
import React from "react";
import Icon from "../../Icon.jsx";
import PropTypes from "prop-types";
import Styles from "./renderers.scss";

const ToolRenderer = createReactClass({
  displayName: "ZoomTool",
  propTypes: {
    icon: PropTypes.object
  },
  render() {
    return (
      <span className={Styles.tools}>
        <Icon glyph={this.props.icon} />
      </span>
    );
  }
});
module.exports = ToolRenderer;
