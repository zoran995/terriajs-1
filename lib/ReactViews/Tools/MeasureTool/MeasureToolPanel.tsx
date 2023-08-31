import { TFunction } from "i18next";
import { action, observable, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import { DrawTypeEnum } from "../../../Models/Drawing/DrawType";
import MeasureDrawing from "../../../Models/Drawing/MeasureDrawing";
import updateArea from "../../../Models/Drawing/MeasureDrawingArea";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../Styled/Icon";
import ToolPanel, { MainPanel, ResultWrapper, Selector } from "../ToolPanel";
import { applyTranslationIfExists } from "./../../../Language/languageHelpers";
import { MeasureType, measureTypes, MeasureUnits } from "./MeasureUnits";

export const MEASURE_TOOL_ID = "measure-tool-panel";

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;

interface PropsType extends WithTranslation {
  viewState: ViewState;
  theme: DefaultTheme;
}

@observer
class MeasureToolPanel extends React.Component<PropsType> {
  static displayName: "MeasureToolPanel";
  @observable
  drawing: MeasureDrawing;

  @observable
  result: number | Cartesian3 = 0;

  @observable
  prettyResult: string = "";

  private terria: Terria;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
    this.terria = props.viewState.terria;
    this.drawing = new MeasureDrawing({
      terria: this.terria,
      messageHeader: props.t("measure.measureTool"),
      onPointClicked: this.onPointClicked,
      onPointMoved: this.onPointMoved,
      onCleanUp: this.onCleanUp,
      onMakeDialogMessage: () => "",
      shouldRenderInteractionWindow: false
    });
  }

  componentWillUnmount() {
    runInAction(() => {
      this.onClose();
    });
  }

  @observable currentMeasureType: MeasureType = measureTypes[0];
  @observable currentMeasureUnit: MeasureUnits =
    this.currentMeasureType.units[0];

  @action.bound
  changeMeasureType(e: React.ChangeEvent<HTMLSelectElement>): void {
    this.drawing.stopDrawing();
    this.onCleanUp();
    const measureType = measureTypes.find(
      (item) => item.type.toString() === e.target.value
    );
    if (measureType) {
      this.currentMeasureType = measureType;
      this.currentMeasureUnit = measureType.units[0];
    }
  }

  @action.bound
  changeMeasureUnit(e: React.ChangeEvent<HTMLSelectElement>): void {
    const measureUnit = this.currentMeasureType.units.find(
      (item) => item.id.toString() === e.target.value
    );
    if (measureUnit) {
      this.currentMeasureUnit = measureUnit;
      if (this.result !== 0) {
        this.prettyResult = this.currentMeasureUnit.prettifyResult(this.result);
      }
    }
  }

  combineNameAndLabel(name: string, label: string): string {
    return name + " [" + label + "]";
  }

  @action
  updateDistance(pointEntities: CustomDataSource) {
    this.result = this.drawing.updateDistance(pointEntities);
    this.prettyResult = this.currentMeasureUnit.prettifyResult(this.result);
  }

  @action
  updateArea(pointEntities: CustomDataSource) {
    this.result = updateArea(pointEntities, this.terria);
    this.prettyResult = this.currentMeasureUnit.prettifyResult(this.result);
  }

  @action
  updateCoordinate(pointEntities: CustomDataSource) {
    this.result = this.drawing.updateCoordinate(pointEntities);
    this.prettyResult = this.currentMeasureUnit.prettifyResult(this.result);
  }

  @action.bound
  onCleanUp() {
    this.prettyResult = "";
    this.result = 0;
  }

  @action.bound
  onPointClicked(pointEntities: CustomDataSource) {
    if (this.currentMeasureType.type === DrawTypeEnum.LINE) {
      this.updateDistance(pointEntities);
    } else if (this.currentMeasureType.type === DrawTypeEnum.POLYGON) {
      this.updateArea(pointEntities);
    } else if (this.currentMeasureType.type === DrawTypeEnum.POINT) {
      this.updateCoordinate(pointEntities);
    }
  }

  @action.bound
  onPointMoved(pointEntities: CustomDataSource) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  }

  @action.bound
  onMeasureButtonClick() {
    if (!this.drawing.isDrawing) {
      this.drawing.enterDrawMode(this.currentMeasureType.type);
    } else {
      this.drawing.stopDrawing();
    }
  }

  @action
  onClose() {
    this.drawing.stopDrawing();
    const item = this.terria.mapNavigationModel.findItem(MEASURE_TOOL_ID);
    if (item) {
      item.controller.deactivate();
    }
  }

  render() {
    const { viewState, t, i18n, theme } = this.props;
    return (
      <Text large>
        <ToolPanel
          viewState={viewState}
          toolTitle={t("measureTool.title")}
          exitTitle={t("measureTool.exit")}
          glyph={GLYPHS.measure}
        >
          <MainPanel
            isMapFullScreen={viewState.isMapFullScreen}
            styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
          >
            <Text textLight>{t("measureTool.text")}</Text>
            <Spacing bottom={2} />
            <Selector
              viewState={viewState}
              value={this.currentMeasureType.type}
              onChange={this.changeMeasureType}
              label={t("measureTool.labels.measureType")}
            >
              {measureTypes.map((measureType) => (
                <option key={measureType.type} value={measureType.type}>
                  {t(measureType.name)}
                </option>
              ))}
            </Selector>
            <Spacing bottom={2} />
            <Selector
              viewState={viewState}
              value={this.currentMeasureUnit.id}
              onChange={this.changeMeasureUnit}
              label={t("measureTool.labels.measureUnit")}
            >
              {this.currentMeasureType.units.map((measureUnit) => (
                <option key={measureUnit.id} value={measureUnit.id}>
                  {this.combineNameAndLabel(
                    t(measureUnit.name),
                    t(measureUnit.label)
                  )}
                </option>
              ))}
            </Selector>
            <Spacing bottom={2} />
            {!this.drawing.isDrawing && (
              <MeasureButton onClick={this.onMeasureButtonClick}>
                {t("measureTool.startMeasuring")}
              </MeasureButton>
            )}
            {this.drawing.isDrawing && (
              <MeasureButton onClick={this.onMeasureButtonClick}>
                {t("measureTool.stopMeasuring")}
              </MeasureButton>
            )}
          </MainPanel>
        </ToolPanel>
        {this.drawing.isDrawing && (
          <ResultWrapper isMapFullScreen={viewState.isMapFullScreen}>
            <MeasureToolContent
              title={t("measureTool.result")}
              content={this.prettyResult}
              helpMessage={applyTranslationIfExists(
                this.drawing.tooltipMessage,
                i18n
              )}
            />
          </ResultWrapper>
        )}
      </Text>
    );
  }
}

const MeasureButton = styled(Button).attrs({
  primary: true,
  fullWidth: true
})``;

interface MeasureToolContentProps {
  title: string;
  content: string;
  helpMessage: string;
}

const MeasureToolContent: React.FC<MeasureToolContentProps> = (props) => {
  return (
    <Box fullWidth column>
      <Text medium textAlignCenter>
        {props.title}
      </Text>
      <Text bold medium textAlignCenter>
        {props.content}
      </Text>
      <Text italic small textAlignCenter>
        {props.helpMessage}
      </Text>
    </Box>
  );
};

export default withTranslation()(withTheme(MeasureToolPanel));
