import React from "react";
import ObserveModelMixin from "../../ObserveModelMixin";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./style-point-panel.scss";
import classNames from "classnames";
import { withTranslation } from "react-i18next";

const StylePointPanel = createReactClass({
  displayName: "StylePointPanel",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    closePanel: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      size: this.props.feature.point.pixelSize,
      fillColor: this.props.feature.point.color,
      outlineColor: this.props.feature.point.outlineColor,
      outlineWidth: this.props.feature.point.outlineWidth
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
    this.props.drawingFunction.changePointStyle(this.props.feature, {
      pixelSize: this.state.size,
      color: this.state.fillColor,
      outlineColor: this.state.outlineColor,
      outlineWidth: this.state.outlineWidth
    });
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.outerDiv}>
        <div className={Styles.popup}>
          <div className={Styles.inner}>
            <div className={Styles.title}>
              <span>
                <span>size</span>{" "}
                <input
                  type="text"
                  name="size"
                  className={Styles.field}
                  value={this.state.size}
                  onChange={this.handleChange}
                />
                <span>px</span>
              </span>
              <br />
              <span>
                <span>Fill color</span>{" "}
                <input
                  type="text"
                  name="fillColor"
                  className={Styles.field}
                  value={this.state.fillColor}
                  onChange={this.handleChange}
                />
              </span>
              <br />
              <span>
                <span>Stroke color</span>{" "}
                <input
                  type="text"
                  name="outlineColor"
                  className={Styles.field}
                  value={this.state.outlineColor}
                  onChange={this.handleChange}
                />
              </span>
              <br />
              <span>
                <span>Stroke width</span>{" "}
                <input
                  type="text"
                  name="outlineWidth"
                  className={Styles.field}
                  value={this.state.outlineWidth}
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

module.exports = withTranslation()(StylePointPanel);
