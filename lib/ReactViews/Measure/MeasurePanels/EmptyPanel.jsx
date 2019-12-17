import React from "react";
import createReactClass from "create-react-class";
import Switcher from "../Switcher";
import ResultPanel from "./../ResultPanel";

const EmptyPanel = createReactClass({
  displayName: "EmptyPanel",

  render() {
    return (
      <div>
        <Switcher />
        <ResultPanel result="" />
      </div>
    );
  }
});
module.exports = EmptyPanel;
