import i18next, { TFunction } from "i18next";
import { action, observable, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import isDefined from "../../../Core/isDefined";
import DkpManager, {
  CadastralMunicipality,
  Municipality
} from "../../../Models/DkpManager";
import ViewState from "../../../ReactViewModels/ViewState";
import Input from "../../../Styled/Input";
import { TooltipWithButtonLauncher } from "../../Generic/TooltipWrapper";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Loader from "../../Loader";
import WarningBox from "../../Preview/WarningBox";
import ToolPanel, { MainPanel, Selector } from "../ToolPanel";
import { removeMarker } from "../../../Models/LocationMarkerUtils";
import Box from "../../../Styled/Box";
import Text, { TextSpan } from "../../../Styled/Text";
import Button from "../../../Styled/Button";
import Spacing from "../../../Styled/Spacing";

export const DKP_SEARCH_ID = "dkp-search";

const WarningText = styled(Text)`
  color: red;
`;

interface PropsType extends WithTranslation {
  t: TFunction;
  viewState: ViewState;
  theme: DefaultTheme;
}

@observer
class DkpSearch extends React.Component<PropsType> {
  static displayName: "DkpSearchPanel";

  private dkpManager: DkpManager;

  @observable private parcelNumber?: string;
  @observable private charactersAllowed?: boolean;
  @observable private currentMuncipality?: Municipality;
  @observable private currentCadastralMunicipality?: CadastralMunicipality;
  @observable private municipalities?: Municipality[];
  @observable private cadastralMunicipalities?: CadastralMunicipality[];
  @observable private isSearching: boolean;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
    this.dkpManager = new DkpManager({ terria: props.viewState.terria });
    this.isSearching = true;
    this.initialise();
  }

  initialise() {
    this.dkpManager
      .loadMunicipalities()
      .then((result) => {
        runInAction(() => {
          this.municipalities = result;
          if (this.municipalities && this.municipalities.length > 0) {
            this.currentMuncipality = this.municipalities[0];
          }
        });
      })
      .then(() => {
        if (this.currentMuncipality) {
          return this.dkpManager.updateCadastralMunicipalities(
            this.currentMuncipality
          );
        }
      })
      .then((result) => {
        if (result) {
          runInAction(() => {
            this.cadastralMunicipalities = result;
            if (this.cadastralMunicipalities) {
              this.currentCadastralMunicipality =
                this.cadastralMunicipalities[0];
            }
          });
        }
      });
  }

  updateSearchState(state: boolean) {
    this.isSearching = state;
  }

  componentDidMount() {}

  componentWillUnmount() {
    removeMarker(this.props.viewState.terria);
    runInAction(() => {
      this.onClose();
    });
  }

  onClose() {
    const item =
      this.props.viewState.terria.mapNavigationModel.findItem(DKP_SEARCH_ID);
    if (item) {
      item.controller.deactivate();
    }
  }

  @action.bound
  changeText(event: { target: HTMLInputElement }) {
    this.parcelNumber = event.target.value;
    this.charactersAllowed = isParcelNumberCorrect(this.parcelNumber);
    if (this.dkpManager.errorMessage) {
      this.dkpManager.errorMessage = undefined;
    }
  }

  @action.bound
  async changeMunicipality(e: React.ChangeEvent<HTMLSelectElement>) {
    const curMunc = this.municipalities?.find(
      (element) => element.id?.toString() === e.target.value
    );

    this.currentMuncipality = curMunc;

    if (this.dkpManager.errorMessage) {
      this.dkpManager.errorMessage = undefined;
    }

    if (curMunc) {
      this.dkpManager.updateCadastralMunicipalities(curMunc).then((result) => {
        runInAction(() => {
          this.cadastralMunicipalities = result as CadastralMunicipality[];
        });
      });
    }
  }

  @action.bound
  changeCadastralMunicipality(e: React.ChangeEvent<HTMLSelectElement>) {
    if (this.dkpManager.errorMessage) {
      this.dkpManager.errorMessage = undefined;
    }

    const curCadMun = this.cadastralMunicipalities?.find(
      (element) => element.name === e.target.value
    );

    this.currentCadastralMunicipality = curCadMun;
  }

  get checkSlash(): boolean {
    if (!this.parcelNumber) {
      return false;
    }
    const lastChar = this.parcelNumber.substr(-1);
    if (lastChar === "/" && this.parcelNumber.split("/").length === 2) {
      return false;
    }

    return true;
  }

  render() {
    const { viewState, t } = this.props;
    if (!viewState.terria.parcelSearchAllowed) {
      removeMarker(viewState.terria);
      return null;
    }
    return (
      <Text large>
        <ToolPanel
          viewState={viewState}
          toolTitle={t("dkpSearch.title")}
          exitTitle={t("dkpSearch.exit")}
          glyph={GLYPHS.parcela}
        >
          <MainPanel
            isMapFullScreen={viewState.isMapFullScreen}
            styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
          >
            <Text textLight>{t("dkpSearch.text")}</Text>
            <Spacing bottom={2} />
            <Selector
              viewState={viewState}
              value={this.currentMuncipality?.id}
              onChange={this.changeMunicipality}
              label={t("dkpSearch.labels.municipality")}
              spacingBottom
            >
              {this.municipalities?.map((municipality) => (
                <option key={municipality.id} value={municipality.id}>
                  {i18next.language === "sr-Cyrl"
                    ? municipality.nameCyr
                    : municipality.name}
                </option>
              ))}
            </Selector>
            <Selector
              viewState={viewState}
              value={this.currentCadastralMunicipality?.name}
              onChange={this.changeCadastralMunicipality}
              label={t("dkpSearch.labels.cadastralMunicipality")}
              spacingBottom
              disabled={
                !this.currentMuncipality && !this.cadastralMunicipalities
              }
            >
              {this.cadastralMunicipalities?.map((cadastralMunicipality) => (
                <option
                  key={cadastralMunicipality.name}
                  value={cadastralMunicipality.name}
                >
                  {i18next.language === "sr-Cyrl"
                    ? cadastralMunicipality?.nameCyr
                    : cadastralMunicipality?.name}
                </option>
              ))}
            </Selector>
            <Box fullWidth column>
              <Box fullWidth>
                <TextSpan textLight css={"margin-right: 5px;"}>
                  {t("dkpSearch.labels.parcelNumber")}:
                </TextSpan>
                <TooltipWithButtonLauncher
                  dismissOnLeave={true}
                  launcherComponent={() => (
                    <Box>
                      <StyledIcon
                        light
                        glyph={GLYPHS.help}
                        styledWidth={"13px"}
                      />
                    </Box>
                  )}
                  children={() => (
                    <Text>{t("dkpSearch.warnings.wrongCharacterWarning")}</Text>
                  )}
                  styledWidth={"200px"}
                ></TooltipWithButtonLauncher>
              </Box>

              <Spacing bottom={1} />
              <Input
                styledHeight={"34px"}
                dark
                id="parcelNumber"
                type="text"
                name="parcelNumber"
                value={this.parcelNumber || ""} //{this.props.drawing.textStyle.text || ""}
                onChange={this.changeText}
                placeholder={t("dkpSearch.labels.parcelNumber")}
                autoComplete="off"
                disabled={
                  !this.currentMuncipality || !this.currentCadastralMunicipality
                }
              ></Input>
              <Spacing bottom={2} />
              {this.parcelNumber !== "" &&
                !this.charactersAllowed &&
                this.checkSlash && (
                  <WarningText>
                    {t("dkpSearch.warnings.wrongInputWarning")}
                  </WarningText>
                )}
              {this.dkpManager.errorMessage && (
                <WarningBox>{this.dkpManager.errorMessage}</WarningBox>
              )}
            </Box>
            {this.dkpManager.isSearching && (
              <Loader
                light
                boxProps={{ fullWidth: true, centered: true }}
                textProps={{ textLight: true }}
              />
            )}
            <Spacing bottom={2} />
            <ToolButton
              onClick={() => {
                if (
                  this.currentMuncipality &&
                  this.currentCadastralMunicipality &&
                  this.parcelNumber
                )
                  this.dkpManager.searchParcel(
                    this.currentMuncipality,
                    this.currentCadastralMunicipality,
                    this.parcelNumber
                  );
              }}
              disabled={this.parcelNumber === "" || !this.charactersAllowed}
            >
              {t("dkpSearch.buttonLabel")}
            </ToolButton>
          </MainPanel>
        </ToolPanel>
      </Text>
    );
  }
}

function isParcelNumberCorrect(parcelNumber: string | undefined) {
  const regex = /^\d+(\/\d+)?$/;
  if (isDefined(parcelNumber)) {
    return regex.test(parcelNumber) === true;
  } else {
    return false;
  }
}

const ToolButton = styled(Button).attrs({
  toolButton: true,
  fullWidth: true
})``;

export default withTranslation()(withTheme(DkpSearch));
