import { TFunction } from "i18next";
import { action, computed, observable, toJS, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import CoordinateSearchUtils from "../../../Models/CoordinateSearchUtils";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import Button from "../../../Styled/Button";
import { GLYPHS } from "../../../Styled/Icon";
import Input from "../../../Styled/Input";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";
import ToolPanel, { MainPanel, Selector } from "../ToolPanel";
import LatLonHeight from "./../../../Core/LatLonHeight";
import { applyTranslationIfExists } from "./../../../Language/languageHelpers";
import { Projection } from "../../../Map/Vector/Projection";

interface PropTypes extends WithTranslation {
  viewState: ViewState;
  theme: DefaultTheme;
}

@observer
class CoordinateSearch extends React.Component<PropTypes> {
  private terria: Terria;
  private readonly projections: Projection[];
  @observable projection: Projection;
  @observable firstCoord: string = "";
  @observable secondCoord: string = "";

  private coordinateSearch: CoordinateSearchUtils;
  constructor(props: PropTypes) {
    super(props);
    makeObservable(this);
    this.terria = props.viewState.terria;
    this.projections = this.terria.projections.filter(
      (projection) => projection.params.useInSearch && projection.toLatLon
    );
    const proj = toJS(this.terria.projection);
    if (
      this.projections.some(
        (projection) => projection.params.id === proj.params.id
      )
    ) {
      this.projection = proj;
    } else {
      this.projection = this.projections[0];
    }

    this.coordinateSearch = new CoordinateSearchUtils({ terria: this.terria });
  }

  componentDidMount() {
    this.coordinateSearch.startSearch();
  }

  componentWillUnmount() {
    this.coordinateSearch.cleanUp();
  }

  @action.bound
  changeProjection(e: React.ChangeEvent<HTMLSelectElement>): void {
    const projection = this.projections.find(
      (projection) => projection.params.id === e.target.value
    );

    if (projection) {
      this.projection = projection;
      this.firstCoord = "";
      this.secondCoord = "";
      this.findPoint();
    }
  }

  @action.bound
  changeSecond(e: React.ChangeEvent<HTMLInputElement>) {
    this.secondCoord = inputValidation(e.target.value, this.secondCoord);
    this.findPoint();
  }

  @action.bound
  changeFirst(e: React.ChangeEvent<HTMLInputElement>) {
    this.firstCoord = inputValidation(e.target.value, this.firstCoord);
    this.findPoint();
  }

  @computed
  get getLatLon(): LatLonHeight | undefined {
    if (!this.firstCoord || !this.secondCoord) {
      return undefined;
    }
    const firstCoord = this.firstCoord === "-" ? "0" : this.firstCoord;
    const secondCoord = this.secondCoord === "-" ? "0" : this.secondCoord;
    let latLon: LatLonHeight;
    if (this.projection.toLatLon) {
      latLon = this.projection.toLatLon(
        parseFloat(firstCoord),
        parseFloat(secondCoord)
      );
    } else {
      latLon = {
        latitude: parseFloat(firstCoord),
        longitude: parseFloat(secondCoord)
      };
    }
    return latLon;
  }

  @action.bound
  findPoint() {
    const latLon = this.getLatLon;
    if (!latLon) {
      this.coordinateSearch.removeMarker();
      return;
    }
    this.coordinateSearch.addMarker({
      name: "Point",
      location: {
        longitude: !isNaN(latLon.longitude) ? latLon.longitude : 0,
        latitude: !isNaN(latLon.latitude) ? latLon.latitude : 0
      }
    });
  }

  @action.bound
  showLocation() {
    const latLon = this.getLatLon;
    if (!latLon) return;
    this.coordinateSearch.jumpToPoint(latLon);
  }

  render() {
    const { t, i18n, viewState } = this.props;
    const firstAxisName = applyTranslationIfExists(
      this.projection.params.firstAxisNameFull ||
        this.projection.params.firstAxisName ||
        "E",
      i18n
    );
    const secondAxisName = applyTranslationIfExists(
      this.projection.params.secondAxisNameFull ||
        this.projection.params.secondAxisName ||
        "N",
      i18n
    );
    return (
      <ToolPanel
        viewState={viewState}
        toolTitle={t("coordinateSearch.title")}
        exitTitle={t("coordinateSearch.exit")}
        glyph={GLYPHS.parcela}
      >
        <MainPanel
          isMapFullScreen={viewState.isMapFullScreen}
          styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
        >
          <Selector
            viewState={viewState}
            value={this.projection.params.id}
            onChange={this.changeProjection}
            label={t("coordinateSearch.projection")}
            spacingBottom
          >
            {this.projections.map((projection) => (
              <option key={projection.params.id} value={projection.params.id}>
                {applyTranslationIfExists(projection.params.name, i18n)}
              </option>
            ))}
          </Selector>

          <InputLabel
            viewState={viewState}
            //label={firstAxisName}
            styledHeight={"34px"}
            dark
            type="text"
            name={this.projection.params.firstAxisName}
            value={this.firstCoord}
            onChange={this.changeFirst}
            placeholder={firstAxisName}
            autoComplete="off"
            spacingBottom
          ></InputLabel>
          <InputLabel
            viewState={viewState}
            //label={secondAxisName}
            styledHeight={"34px"}
            dark
            type="text"
            name={this.projection.params.secondAxisName}
            value={this.secondCoord}
            onChange={this.changeSecond}
            placeholder={secondAxisName}
            autoComplete="off"
            spacingBottom
          ></InputLabel>
          <ToolButton
            primary
            fullWidth
            round
            onClick={this.showLocation}
            disabled={!this.firstCoord || !this.secondCoord}
          >
            {t("coordinateSearch.showMarker")}
          </ToolButton>
        </MainPanel>
      </ToolPanel>
    );
  }
}

interface InputProps {
  label?: string;
  viewState: ViewState;
  spacingBottom?: boolean;
  [key: string]: any;
}

const InputLabel = (props: InputProps) => {
  const { label, viewState, spacingBottom, ...inputProps } = props;
  return (
    <Box fullWidth column>
      <label>
        {label && (
          <>
            <Text textLight css={"p {margin: 0;}"}>
              {parseCustomMarkdownToReactWithOptions(`${label}:`, {
                injectTermsAsTooltips: true,
                tooltipTerms: viewState.terria.configParameters.helpContentTerms
              })}
            </Text>
            <Spacing bottom={1} />
          </>
        )}
        <Input {...inputProps}></Input>
        {spacingBottom && <Spacing bottom={2} />}
      </label>
    </Box>
  );
};

const ToolButton = styled(Button).attrs({
  primary: true,
  fullWidth: true
})``;

function inputValidation(input: string, oldValue: string): string {
  const valid = /^-?\d*\.?\d*$/.test(input);
  if (input.length === 0 || valid) {
    return input;
  } else {
    return oldValue;
  }
}

export default withTranslation()(withTheme(CoordinateSearch));
