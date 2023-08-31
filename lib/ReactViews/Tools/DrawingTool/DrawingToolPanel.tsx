import { TFunction } from "i18next";
import { action, observable, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import {
  useTranslation,
  WithTranslation,
  withTranslation
} from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import { applyTranslationIfExists } from "../../../Language/languageHelpers";
import Drawing from "../../../Models/Drawing/Drawing";
import {
  ColorInterface,
  DrawMode,
  drawModes,
  FontType,
  lineStyles,
  pointStyles,
  polygonStyles,
  textStyles
} from "../../../Models/Drawing/DrawingUtils";
import { DrawTypeEnum } from "../../../Models/Drawing/DrawType";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import { GLYPHS } from "../../../Styled/Icon";
import Input from "../../../Styled/Input";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";
import ToolPanel, { MainPanel, ResultWrapper, Selector } from "../ToolPanel";

const Slider: any = require("rc-slider").default;

export const DRAWING_TOOL_ID = "drawing-tool";

interface PropsType extends WithTranslation {
  t: TFunction;
  viewState: ViewState;
  theme: DefaultTheme;
}

@observer
class DrawingToolPanel extends React.Component<PropsType> {
  static displayName: "DrawingToolPanel";
  @observable drawing: Drawing;

  private terria: Terria;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
    this.terria = props.viewState.terria;

    this.drawing = Drawing.getInstance(this.terria);
  }

  componentWillUnmount() {
    runInAction(() => {
      this.onClose();
    });
  }

  @action.bound
  onStartDrawing() {
    if (!this.drawing.isDrawing) {
      this.drawing.enterDrawMode(this.currentDrawingMode.type);
    } else {
      this.drawing.stopDrawing();
    }
  }

  @action.bound
  onStartDelete() {
    if (!this.drawing.isDeleting) {
      this.drawing.startDeleteElement();
    } else {
      this.drawing.stopDeleting();
    }
  }
  @observable currentDrawingMode: DrawMode = drawModes[0];

  @action.bound
  changeDrawingMode(e: React.ChangeEvent<HTMLSelectElement>): void {
    this.drawing.stopDrawing();
    const drawingMode = drawModes.find(
      (item) => item.type.toString() === e.target.value
    );
    if (drawingMode) {
      this.currentDrawingMode = drawingMode;
    }
  }

  @action
  onClose() {
    this.drawing.stopDrawing();
    this.drawing.stopDeleting();
    const item = this.terria.mapNavigationModel.findItem(DRAWING_TOOL_ID);
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
          toolTitle={t("drawingTool.title")}
          exitTitle={t("drawingTool.exit")}
          glyph={GLYPHS.pen}
        >
          <MainPanel
            isMapFullScreen={viewState.isMapFullScreen}
            styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
          >
            <Text textLight>{t("drawingTool.text")}</Text>
            <Spacing bottom={2} />
            <Selector
              viewState={viewState}
              value={this.currentDrawingMode.type}
              onChange={this.changeDrawingMode}
              spacingBottom
              label={t("drawingTool.drawingElement")}
            >
              {drawModes.map((drawMode) => (
                <option
                  key={`draw-mode-${drawMode.type}`}
                  value={drawMode.type}
                >
                  {t(drawMode.name)}
                </option>
              ))}
            </Selector>
            {this.currentDrawingMode.type === DrawTypeEnum.POINT && (
              <PointPanel drawing={this.drawing} viewState={viewState} />
            )}
            {this.currentDrawingMode.type === DrawTypeEnum.LINE && (
              <LinePanel drawing={this.drawing} viewState={viewState} />
            )}
            {this.currentDrawingMode.type === DrawTypeEnum.POLYGON && (
              <PolygonPanel drawing={this.drawing} viewState={viewState} />
            )}
            {this.currentDrawingMode.type === DrawTypeEnum.LABEL && (
              <LabelPanel drawing={this.drawing} viewState={viewState} />
            )}
            <Spacing bottom={2} />
            <Box fullWidth>
              <ToolButton
                primary
                fullWidth
                roundLeft
                onClick={this.onStartDrawing}
                splitter={this.drawing.isDrawing}
              >
                {!this.drawing.isDrawing
                  ? t("drawingTool.start")
                  : t("drawingTool.finish")}
              </ToolButton>
              <Spacing marginRight={1} />
              <ToolButton
                primary
                fullWidth
                roundRight
                onClick={this.onStartDelete}
                splitter={this.drawing.isDeleting}
                disabled={!this.drawing.isDeleteEnabled}
              >
                {!this.drawing.isDeleting
                  ? t("drawingTool.deleteElement")
                  : t("drawingTool.stopDeleteElement")}
              </ToolButton>
            </Box>
          </MainPanel>
        </ToolPanel>
        {this.drawing.isDrawing && (
          <ResultWrapper isMapFullScreen={viewState.isMapFullScreen}>
            <TooltipContent
              helpMessage={applyTranslationIfExists(
                this.drawing.tooltipMessage,
                i18n
              )}
            />
          </ResultWrapper>
        )}
        {this.drawing.isDeleting && (
          <ResultWrapper isMapFullScreen={viewState.isMapFullScreen}>
            <TooltipContent helpMessage={t("drawingTool.clickToDelete")} />
          </ResultWrapper>
        )}
      </Text>
    );
  }
}

interface TooltipContentProps {
  helpMessage: string;
}

const TooltipContent: React.FC<TooltipContentProps> = (props) => {
  return (
    <Box fullWidth column>
      <Text italic small textAlignCenter>
        {props.helpMessage}
      </Text>
    </Box>
  );
};

const ToolButton = styled(Button)`
  ${(props) => props.roundLeft && `border-radius: 20px 0 0 20px;`}
  ${(props) => props.roundRight && `border-radius: 0 20px 20px 0;`}
`;

interface DrawingPanelProps {
  drawing: Drawing;
  viewState: ViewState;
}

const PointPanel: React.FC<DrawingPanelProps> = observer((props) => {
  const { t } = useTranslation();
  const changePointStyle = function (style: {
    color?: ColorInterface;
    opacity?: number;
    size?: number;
  }) {
    runInAction(() => {
      props.drawing.pointStyle = {
        color: style.color ? style.color : props.drawing.pointStyle.color,
        opacity: style.opacity
          ? style.opacity
          : props.drawing.pointStyle.opacity,
        size: style.size ? style.size : props.drawing.pointStyle.size
      };
    });
  };
  return (
    <Box fullWidth column>
      <Selector
        viewState={props.viewState}
        value={props.drawing.pointStyle.size}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          changePointStyle({ size: parseInt(e.target.value, 10) });
        }}
        spacingBottom
        label={t("drawingTool.pointPanel.size")}
      >
        {pointStyles.pointSizes.map((pointSize) => (
          <option key={`point-size-${pointSize}`} value={pointSize}>
            {`${pointSize} px`}
          </option>
        ))}
      </Selector>
      <OpacitySlider
        styledWidth={"80%"}
        opacity={
          props.drawing.pointStyle?.opacity
            ? props.drawing.pointStyle.opacity
            : 1
        }
        changeOpacity={(value: number) => {
          changePointStyle({
            opacity: value
          });
        }}
      ></OpacitySlider>
      <Spacing bottom={2} />
      <ColorChooser
        label={t("drawingTool.labels.pointColor")}
        viewState={props.viewState}
        colorList={pointStyles.colorList}
        selectedColor={props.drawing.pointStyle.color}
        onClick={changePointStyle}
      />
    </Box>
  );
});

const LinePanel: React.FC<DrawingPanelProps> = observer((props) => {
  const { t } = useTranslation();
  const changeLineStyle = function (style: {
    color?: ColorInterface;
    opacity?: number;
    width?: number;
  }) {
    runInAction(() => {
      props.drawing.lineStyle = {
        color: style.color ? style.color : props.drawing.lineStyle.color,
        opacity: style.opacity
          ? style.opacity
          : props.drawing.lineStyle.opacity,
        width: style.width ? style.width : props.drawing.lineStyle.width
      };
    });
    if (props.drawing.getCurrentEntityId) {
      props.drawing.entities.entities.removeById(
        props.drawing.getCurrentEntityId
      );
      props.drawing.startLineDraw();
    }
  };
  return (
    <Box fullWidth column>
      <Selector
        viewState={props.viewState}
        value={props.drawing.lineStyle.width}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          changeLineStyle({ width: parseInt(e.target.value, 10) });
        }}
        spacingBottom
        label={t("drawingTool.linePanel.width")}
      >
        {lineStyles.lineWidths.map((lineWidth) => (
          <option key={`width-${lineWidth}`} value={lineWidth}>
            {`${lineWidth} px`}
          </option>
        ))}
      </Selector>
      <OpacitySlider
        styledWidth={"80%"}
        opacity={
          props.drawing.lineStyle.opacity ? props.drawing.lineStyle.opacity : 1
        }
        changeOpacity={(value: number) => {
          changeLineStyle({
            opacity: value
          });
        }}
      ></OpacitySlider>
      <Spacing bottom={2} />
      <ColorChooser
        label={t("drawingTool.labels.lineColor")}
        viewState={props.viewState}
        colorList={lineStyles.colorList}
        selectedColor={props.drawing.lineStyle.color}
        onClick={changeLineStyle}
      />
    </Box>
  );
});

const PolygonPanel: React.FC<DrawingPanelProps> = observer((props) => {
  const { t } = useTranslation();
  const changePolygonStyle = function (style: {
    color?: ColorInterface;
    outlineColor?: ColorInterface;
    outlineWidth?: number;
    opacity?: number;
  }) {
    runInAction(() => {
      props.drawing.polygonStyle = {
        fillColor: style.color
          ? style.color
          : props.drawing.polygonStyle.fillColor,
        outlineColor: style.outlineColor
          ? style.outlineColor
          : props.drawing.polygonStyle.outlineColor,
        opacity: style.opacity
          ? style.opacity
          : props.drawing.polygonStyle.opacity,
        outlineWidth: style.outlineWidth
          ? style.outlineWidth
          : props.drawing.polygonStyle.outlineWidth
      };
    });
    if (props.drawing.getCurrentEntityId) {
      props.drawing.entities.entities.removeById(
        props.drawing.getCurrentEntityId
      );
      props.drawing.startPolygonDraw();
    }
  };
  return (
    <Box fullWidth column>
      <Selector
        viewState={props.viewState}
        value={props.drawing.polygonStyle.outlineWidth}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          changePolygonStyle({ outlineWidth: parseInt(e.target.value, 10) });
        }}
        spacingBottom
        label={t("drawingTool.polygonPanel.outlineWidth")}
      >
        {polygonStyles.outlineWidths.map((lineWidth) => (
          <option key={`width-${lineWidth}`} value={lineWidth}>
            {`${lineWidth} px`}
          </option>
        ))}
      </Selector>
      <OpacitySlider
        styledWidth={"80%"}
        opacity={
          props.drawing.polygonStyle.opacity
            ? props.drawing.polygonStyle.opacity
            : 1
        }
        changeOpacity={(value: number) => {
          changePolygonStyle({
            opacity: value
          });
        }}
      ></OpacitySlider>
      <Spacing bottom={2} />
      <ColorChooser
        label={t("drawingTool.labels.polygonFillColor")}
        viewState={props.viewState}
        colorList={polygonStyles.fillColorList}
        selectedColor={props.drawing.polygonStyle.fillColor}
        onClick={changePolygonStyle}
      />
    </Box>
  );
});

const LabelPanel: React.FC<DrawingPanelProps> = observer((props) => {
  const { t } = useTranslation();
  const changeTextStyle = function (style: {
    font?: FontType;
    size?: number;
    text: string;
    color?: ColorInterface;
  }) {
    runInAction(() => {
      props.drawing.textStyle = {
        color: style.color ? style.color : props.drawing.textStyle.color,
        size: style.size ? style.size : props.drawing.textStyle.size,
        font: style.font ? style.font : props.drawing.textStyle.font,
        text: style.text
      };
    });
  };

  return (
    <Box fullWidth column>
      <Box fullWidth column>
        <Text textLight css={"p {margin: 0;}"}>
          {parseCustomMarkdownToReactWithOptions(
            `${t("drawingTool.textPanel.text")}:`,
            {
              injectTermsAsTooltips: true,
              tooltipTerms:
                props.viewState.terria.configParameters.helpContentTerms
            }
          )}
        </Text>
        <Input
          styledHeight={"34px"}
          dark
          id="drawText"
          type="text"
          name="drawText"
          value={props.drawing.textStyle.text || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            changeTextStyle({
              text: e.target.value
            });
          }}
          placeholder="Text"
          autoComplete="off"
        ></Input>
      </Box>
      <Spacing bottom={2} />
      <Selector
        viewState={props.viewState}
        value={props.drawing.textStyle.font.type}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          changeTextStyle({
            font: textStyles.fonts.find(
              (font) => font.type.toString() === e.target.value
            ),
            text: props.drawing.textStyle.text
          });
        }}
        spacingBottom
        label={t("drawingTool.textPanel.font")}
      >
        {textStyles.fonts.map((font) => (
          <option key={`font-${font.type}`} value={font.type}>
            {font.name}
          </option>
        ))}
      </Selector>
      <Selector
        viewState={props.viewState}
        value={props.drawing.textStyle.size}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          changeTextStyle({
            size: parseInt(e.target.value, 10),
            text: props.drawing.textStyle.text
          });
        }}
        spacingBottom
        label={t("drawingTool.textPanel.size")}
      >
        {textStyles.sizes.map((size) => (
          <option key={`text-size-${size}`} value={size}>
            {`${size} px`}
          </option>
        ))}
      </Selector>
      <ColorChooser
        label={t("drawingTool.labels.textColor")}
        viewState={props.viewState}
        colorList={textStyles.colorList}
        selectedColor={props.drawing.textStyle.color}
        onClick={changeTextStyle}
        text={props.drawing.textStyle.text}
      />
    </Box>
  );
});

interface OpacityProps {
  styledWidth: string;
  opacity: number;
  changeOpacity(value: number): void;
}
const OpacitySlider: React.FC<OpacityProps> = (props) => {
  const { t } = useTranslation();

  const onChange = (value: number) => {
    props.changeOpacity(value / 100.0);
  };

  return (
    <Box fullWidth column>
      <Text textLight css={"p {margin: 0;}"}>
        {t("drawingTool.opacity", {
          opacity: Math.round(props.opacity * 100)
        })}
      </Text>
      <Spacing bottom={1} />
      <StyledSlider
        min={0}
        max={100}
        value={(props.opacity * 100) | 0}
        onChange={onChange}
      />
    </Box>
  );
};

const StyledSlider = styled(Slider)`
  margin-top: 2px;
`;

const ColorOuter = styled(Box).attrs({
  styledWidth: "34px",
  styledHeight: "34px"
})`
  background: ${(props) => props.backgroundColor};
  border-radius: 50%;
  cursor: pointer;
`;

interface ColorInnerProps {
  selected?: boolean;
}

const ColorInner = styled(Box).attrs({
  styledWidth: "30px",
  styledHeight: "30px"
})<ColorInnerProps>`
  background: ${(props) => props.backgroundColor};
  border-radius: 50%;
  margin: 2px;
  ${(props) =>
    props.selected &&
    `
    border: 4px solid ${props.theme.darkWithOverlay};
  `}
`;

const ColorElement = (props: any) => {
  return (
    <ColorOuter backgroundColor={props.backgroundColor} onClick={props.onClick}>
      <ColorInner selected={props.selected}></ColorInner>
    </ColorOuter>
  );
};

interface ColorChooserProps {
  colorList: ColorInterface[];
  selectedColor: ColorInterface;
  label: string;
  viewState: ViewState;
  onClick(style: any): void;
  text?: string;
}
const ColorChooser: React.FC<ColorChooserProps> = (props) => {
  return (
    <Box fullWidth column>
      {props.label && (
        <>
          <Text textLight css={"p {margin: 0;}"}>
            {parseCustomMarkdownToReactWithOptions(`${props.label}:`, {
              injectTermsAsTooltips: true,
              tooltipTerms:
                props.viewState.terria.configParameters.helpContentTerms
            })}
          </Text>
          <Spacing bottom={1} />
        </>
      )}
      <Spacing bottom={1} />
      <Box justifySpaceBetween>
        {props.colorList.map((color) => {
          return (
            <ColorElement
              key={`color-${color.value}`}
              backgroundColor={`${color.value.toCssColorString()}`}
              selected={color.value === props.selectedColor.value}
              onClick={() => {
                props.onClick({
                  color: color,
                  text: props.text
                });
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default withTranslation()(withTheme(DrawingToolPanel));
