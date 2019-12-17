import React from "react";
import Styles from "./resultPanel.scss";
import PropTypes from "prop-types";

ResultPanel.propTypes = {
  result: PropTypes.string
};

ResultPanel.displayName = "ResultPanel";

function ResultPanel(props) {
  return (
    <div className={Styles.container}>
      <div className={Styles.title}>Measurement result</div>
      <div className={Styles.result}>{props.result}</div>
    </div>
  );
}

module.exports = ResultPanel;
