import i18next, { TFunction } from "i18next";
import { observer } from "mobx-react";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Select from "../../../Styled/Select";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";
import measureElement from "../../HOCs/measureElement";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Text from "../../../Styled/Text";
import Box from "../../../Styled/Box";
import Button, { RawButton } from "../../../Styled/Button";
import Spacing from "../../../Styled/Spacing";
import { useTranslationIfExists } from "./../../../Language/languageHelpers";
import {
  HelpContentItemTraits,
  PaneMode,
  StepItemTraits,
  TrainerItemTraits
} from "../../../Traits/Configuration/HelpContentTraits";
import Model from "../../../Models/Definition/Model";
import StratumFromTraits from "../../../Models/Definition/StratumFromTraits";
import FlattenedFromTraits from "../../../Models/Definition/FlattenedFromTraits";

const StyledHtml: any = require("../../Map/Panels/HelpPanel/StyledHtml")
  .default;
const CloseButton: any = require("../../Generic/CloseButton").default;

const TrainerBarWrapper = styled(Box)<{ isMapFullScreen: boolean }>`
  top: 0;
  left: ${p => (p.isMapFullScreen ? 0 : Number(p.theme.workbenchWidth))}px;
  z-index: ${p => Number(p.theme.frontComponentZIndex) + 100};
`;

// Help with discoverability
const BoxTrainerExpandedSteps = styled(Box)``;

const getSelectedTrainerFromHelpContent = (
  viewState: ViewState,
  helpContent: readonly StratumFromTraits<HelpContentItemTraits>[]
) => {
  const selected = viewState.selectedTrainerItem;
  const found = helpContent.find(item => item.itemName === selected);
  // Try and find the item that we selected, otherwise find the first trainer pane
  return found || helpContent.find(item => item.paneMode === PaneMode.trainer);
};

// Ripped from StyledHtml.jsx
const Numbers = styled(Text)<{ darkBg: boolean }>`
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  background-color: ${props => props.theme.textLight};
`;

const StepText = styled(Text).attrs({})`
  ol,
  ul {
    padding: 0;
    margin: 0;
    // Dislike these arbitrary aligned numbers but leaving it in for now
    padding-left: 17px;
  }
  li {
    padding-left: 8px;
  }
`;

const renderStep = (
  step: Model<StepItemTraits>,
  number: number,
  viewState: ViewState,
  options: {
    renderDescription: boolean;
    comfortable: boolean;
    footerComponent?: () => void;
  } = {
    renderDescription: true,
    comfortable: false,
    footerComponent: undefined
  }
) => {
  return (
    <Box key={number} paddedVertically>
      <Box alignItemsFlexStart>
        <Numbers textDarker textAlignCenter darkBg>
          {number}
        </Numbers>
        <Spacing right={3} />
      </Box>
      <Box column>
        <Text textLight extraExtraLarge semiBold>
          {useTranslationIfExists(step.title)}
        </Text>
        {options.renderDescription && step?.markdownDescription && (
          <>
            {/* {options.comfortable && <Spacing bottom={2} />} */}
            <Spacing bottom={options.comfortable ? 2 : 1} />
            <StepText medium textLightDimmed>
              <StyledHtml
                viewState={viewState}
                styledTextProps={{ textDark: false, textLightDimmed: true }}
                markdown={step.markdownDescription}
              />
            </StepText>
          </>
        )}
        {options.footerComponent?.()}
      </Box>
    </Box>
  );
};

const renderOrderedStepList = function(
  steps: Model<StepItemTraits[]>,
  viewState: ViewState
) {
  return steps.map((step, index) => (
    <React.Fragment key={index}>
      {renderStep(step, index + 1, viewState)}
      {index + 1 !== steps.length && <Spacing bottom={3} />}
    </React.Fragment>
  ));
};

interface StepAccordionProps {
  viewState: ViewState;
  selectedTrainerSteps: Model<StepItemTraits[]>;
  t: TFunction;
  theme: DefaultTheme;
  selectedTrainer: Model<TrainerItemTraits>;
  isShowingAllSteps: boolean;
  setIsShowingAllSteps: (bool: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (bool: boolean) => void;
  heightFromMeasureElementHOC: number | null;
}
interface StepAccordionState {
  isExpanded: boolean;
}

// Originally written as a SFC but measureElement only supports class components at the moment
class StepAccordionRaw extends React.Component<
  StepAccordionProps,
  StepAccordionState
> {
  refToMeasure: any;
  render() {
    const {
      viewState,
      selectedTrainerSteps,
      t,
      theme,
      selectedTrainer,
      isShowingAllSteps,
      setIsShowingAllSteps,
      isExpanded,
      setIsExpanded,
      heightFromMeasureElementHOC
    } = this.props;
    return (
      <Box
        centered={!isExpanded}
        fullWidth
        justifySpaceBetween
        // onMouseOver={() => setIsPeeking(true)}
      >
        {/* Non-expanded step */}
        <Box
          paddedHorizontally={4}
          column
          aria-hidden={isExpanded}
          overflow="hidden"
          css={`
            max-height: 64px;
            pointer-events: none;
          `}
          ref={(component: any) => {
            if (!isExpanded) this.refToMeasure = component;
          }}
        >
          {renderStep(
            selectedTrainerSteps[viewState.currentTrainerStepIndex],
            viewState.currentTrainerStepIndex + 1,
            viewState,
            { renderDescription: false, comfortable: true }
          )}
        </Box>
        {/* expanded version of the box step */}
        {isExpanded && (
          <Box
            paddedHorizontally={4}
            column
            position="absolute"
            fullWidth
            css={`
              top: 0;
              padding-bottom: 20px;
              // This padding forces the absolutely positioned box to align with
              // the relative width in its clone
              padding-right: 60px;
            `}
            backgroundColor={theme.textBlack}
            ref={(component: any) => (this.refToMeasure = component)}
          >
            {renderStep(
              selectedTrainerSteps[viewState.currentTrainerStepIndex],
              viewState.currentTrainerStepIndex + 1,
              viewState,
              {
                renderDescription: true,
                comfortable: true,
                footerComponent: () => (
                  <>
                    <Spacing bottom={3} />
                    <RawButton
                      onClick={() => setIsShowingAllSteps(!isShowingAllSteps)}
                      title={
                        isShowingAllSteps
                          ? t("trainer.hideAllSteps")
                          : t("trainer.showAllSteps")
                      }
                    >
                      <Text medium primary isLink textAlignLeft>
                        {isShowingAllSteps
                          ? t("trainer.hideAllSteps")
                          : t("trainer.showAllSteps")}
                      </Text>
                    </RawButton>
                  </>
                )
              }
            )}
          </Box>
        )}
        <Box paddedHorizontally={2}>
          <RawButton
            onClick={() => setIsExpanded(!isExpanded)}
            // onMouseOver={() => setIsPeeking(true)}
            // onFocus={() => setIsPeeking(true)}
            title={
              isExpanded
                ? t("trainer.collapseTrainer")
                : t("trainer.expandTrainer")
            }
            // onBlur={() => {
            //   if (!isExpanded) setIsPeeking(false);
            // }}
            css={"z-index:2;"}
          >
            <StyledIcon
              styledWidth="26px"
              light
              glyph={isExpanded ? GLYPHS.accordionClose : GLYPHS.accordionOpen}
            />
          </RawButton>
        </Box>
        {/* Accordion / child steps? */}
        {isShowingAllSteps && (
          <BoxTrainerExpandedSteps
            column
            position="absolute"
            backgroundColor={theme.textBlack}
            fullWidth
            paddedRatio={4}
            overflowY={"auto"}
            css={`
              // top: 32px;
              padding-bottom: 10px;
              top: ${heightFromMeasureElementHOC}px;
              max-height: calc(100vh - ${heightFromMeasureElementHOC}px - 20px);
            `}
          >
            {renderOrderedStepList(selectedTrainerSteps, viewState)}
            {selectedTrainer.footnote ? (
              <>
                <Spacing bottom={3} />
                <Text medium textLightDimmed>
                  <StyledHtml
                    viewState={viewState}
                    styledTextProps={{ textDark: false, textLightDimmed: true }}
                    markdown={selectedTrainer.footnote}
                  />
                </Text>
              </>
            ) : (
              <Spacing bottom={3} />
            )}
          </BoxTrainerExpandedSteps>
        )}
      </Box>
    );
  }
}
const StepAccordion = measureElement(StepAccordionRaw);

interface TrainerBarProps extends WithTranslation {
  viewState: ViewState;
  t: TFunction;
  terria: Terria;
  theme: DefaultTheme;
}

export const TrainerBar = observer((props: TrainerBarProps) => {
  const { t, terria, theme, viewState } = props;
  const { helpContent } = terria.configParameters;

  // All these null guards are because we are rendering based on nested
  // map-owner defined (helpContent)content which could be malformed
  if (!viewState.trainerBarVisible || !helpContent) {
    return null;
  }

  const selectedTrainer = getSelectedTrainerFromHelpContent(
    viewState,
    //@ts-ignore
    helpContent.items
  );
  const selectedTrainerItems = selectedTrainer?.trainerItems;

  if (!selectedTrainerItems) {
    return null;
  }

  const trainerItemIndex =
    viewState.currentTrainerItemIndex <= selectedTrainerItems.length
      ? viewState.currentTrainerItemIndex
      : 0;
  const selectedTrainerItem = selectedTrainerItems[trainerItemIndex];
  const selectedTrainerSteps = selectedTrainerItem?.steps;
  if (!selectedTrainerSteps) {
    return null;
  }

  const isMapFullScreen = viewState.isMapFullScreen;

  return (
    <TrainerBarWrapper
      centered
      position="absolute"
      styledWidth={
        isMapFullScreen
          ? "100%"
          : `calc(100% - ${Number(theme.workbenchWidth)}px)`
      }
      isMapFullScreen={isMapFullScreen}
      onClick={() => viewState.setTopElement("TrainerBar")}
    >
      <Box
        fullWidth
        fullHeight
        centered
        justifySpaceBetween
        backgroundColor={theme.textBlack}
      >
        {/* Trainer Items Dropdown */}
        <Box css={"min-height: 64px;"}>
          {/* <Spacing right={6} /> */}
          <Select
            css={`
              // Overrides on normal select here as we are using a non-normal
              // nowhere-else-in-app usage of select
              width: 290px;
              @media (max-width: ${(p: any) => p.theme.lg}px) {
                width: 84px;
                // hack to effectively visually disable the current option
                // without minimising select click target
                color: transparent;
              }
            `}
            paddingForLeftIcon={"45px"}
            leftIcon={() => (
              <StyledIcon
                css={"padding-left:15px;"}
                light
                styledWidth={"21px"}
                glyph={GLYPHS.oneTwoThree}
              />
            )}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              viewState.setCurrentTrainerItemIndex(Number(e.target.value))
            }
            value={viewState.currentTrainerItemIndex}
            // css={"min-width: 280px;"}
          >
            {selectedTrainerItems.map((item, index) => (
              <option key={item.title} value={index}>
                {useTranslationIfExists(item.title)}
              </option>
            ))}
          </Select>
          {/* <Spacing right={8} /> */}
        </Box>

        {/* Trainer Steps within a Trainer Item */}

        <StepAccordion
          viewState={viewState}
          selectedTrainerSteps={selectedTrainerSteps}
          isShowingAllSteps={viewState.trainerBarShowingAllSteps}
          setIsShowingAllSteps={(bool: boolean) =>
            viewState.setTrainerBarShowingAllSteps(bool)
          }
          isExpanded={viewState.trainerBarExpanded}
          setIsExpanded={(bool: boolean) =>
            viewState.setTrainerBarExpanded(bool)
          }
          selectedTrainer={selectedTrainerItem}
          theme={theme}
          t={t}
        />
        <Spacing right={4} />

        {/* Navigation & Close */}
        <Box>
          <Button
            secondary
            shortMinHeight
            css={`
              background: transparent;
              color: ${theme.textLight};
              border-color: ${theme.textLight};
              ${viewState.currentTrainerStepIndex === 0 &&
                `visibility: hidden;`}
            `}
            onClick={() => {
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex - 1
              );
            }}
          >
            {t("general.back")}
          </Button>
          <Spacing right={2} />
          <Button
            primary
            shortMinHeight
            css={`
              ${viewState.currentTrainerStepIndex ===
                selectedTrainerSteps.length - 1 && `visibility: hidden;`}
            `}
            onClick={() => {
              viewState.setCurrentTrainerStepIndex(
                viewState.currentTrainerStepIndex + 1
              );
            }}
          >
            {t("general.next")}
          </Button>
          <Spacing right={5} />
          <Box centered>
            <CloseButton
              noAbsolute
              // topRight
              color={theme.textLight}
              onClick={() => viewState.setTrainerBarVisible(false)}
            />
          </Box>
          <Spacing right={6} />
        </Box>
      </Box>
    </TrainerBarWrapper>
  );
});

export default withTranslation()(withTheme(TrainerBar));
