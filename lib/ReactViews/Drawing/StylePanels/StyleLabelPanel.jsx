import React from "react";
import ObserveModelMixin from "../../ObserveModelMixin";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./style-label-panel.scss";
import classNames from "classnames";
import { withTranslation } from "react-i18next";

const StyleLabelPanel = createReactClass({
  displayName: "StyleLabelPanel",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    closePanel: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      text: this.props.feature.label.text,
      font: this.props.feature.label.font,
      fillColor: this.props.feature.label.fillColor,
      horizontalOrigin: this.props.feature.label.horizontalOrigin,
      verticalOrigin: this.props.feature.label.verticalOrigin
    };
  },

  handleChange(e) {
    this.setState({
      [e.target.getAttribute("name")]: e.target.value
    });
  },

  setStyle() {
    this.applyStyle();
    this.props.closePanel();
  },
  applyStyle() {
    this.props.drawingFunction.updateLabel(this.props.feature, {
      show: true,
      label: this.state.text,
      font: this.state.font,
      fillColor: this.state.fillColor,
      horizontalOrigin: this.state.horizontalOrigin,
      verticalOrigin: this.state.verticalOrigin
    });
    this.props.drawingFunction.updateTitle(this.props.feature, this.state.text);
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.outerDiv}>
        <div className={Styles.popup}>
          <div className={Styles.inner}>
            <div className={Styles.title}>
              <span>
                <span>label</span>{" "}
                <input
                  type="text"
                  name="text"
                  className={Styles.field}
                  value={this.state.text}
                  onChange={this.handleChange}
                />
                <span>px</span>
              </span>
              <br />
              <span>
                <span>font</span>{" "}
                <input
                  type="text"
                  name="font"
                  className={Styles.field}
                  value={this.state.font}
                  onChange={this.handleChange}
                />
              </span>
              <br />
              <span>
                <span>fillColor</span>{" "}
                <input
                  type="text"
                  name="fillColor"
                  className={Styles.field}
                  value={this.state.fillColor}
                  onChange={this.fillColor}
                />
              </span>
              <br />
              <span>
                <span>horizontalOrigin</span>{" "}
                <input
                  type="text"
                  name="horizontalOrigin"
                  className={Styles.field}
                  value={this.state.horizontalOrigin}
                  onChange={this.handleChange}
                />
                <span>px</span>
              </span>
              <span>
                <span>verticalOrigin</span>{" "}
                <input
                  type="text"
                  name="verticalOrigin"
                  className={Styles.field}
                  value={this.state.verticalOrigin}
                  onChange={this.handleChange}
                />
                <span>px</span>
              </span>
            </div>
            <div className={Styles.footer}>
              <button
                className={classNames(Styles.btn, Styles.setStyle)}
                onClick={this.setStyle}
                type="button"
              >
                OK
              </button>
              <button
                className={classNames(Styles.btn, Styles.cancel)}
                onClick={this.props.closePanel}
                type="button"
              >
                cancel
              </button>
              <button
                className={classNames(Styles.btn, Styles.cancel)}
                onClick={this.applyStyle}
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(StyleLabelPanel);
