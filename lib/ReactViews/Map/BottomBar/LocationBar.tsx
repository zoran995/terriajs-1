import { observer } from "mobx-react";
import React, { Ref, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import {
  PrettyCoordinates,
  PrettyProjected
} from "../../../Map/Vector/prettifyCoordinates";
import MouseCoords from "../../../ReactViewModels/MouseCoords";
import Box from "../../../Styled/Box";
import Select from "../../../Styled/Select";
import { TextSpan } from "../../../Styled/Text";
import { useRefForTerria } from "../../Hooks/useRefForTerria";
import { useViewState } from "../../Context";
import { applyTranslationIfExists } from "./../../../Language/languageHelpers";
import { runInAction } from "mobx";

interface PropTypes {
  mouseCoords: MouseCoords;
}

const StyledText = styled(TextSpan).attrs({
  textLight: true,
  mono: true,
  noWrap: true
})`
  font-size: 0.7rem;
  padding: 0 5px 0 5px;
`;

const SectionSmall = styled(Box).attrs({
  paddedHorizontally: true
})``;

const Section = styled(Box).attrs({
  paddedHorizontally: true
})``;

export const MAP_LOCATION_BAR_NAME = "MapLocationBar";

export const LocationBar: React.FC<PropTypes> = observer(
  ({ mouseCoords }: PropTypes) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const viewState = useViewState();
    const { terria } = viewState;

    const locationBarRef: Ref<HTMLDivElement> = useRefForTerria(
      MAP_LOCATION_BAR_NAME,
      viewState
    );

    const [convertedCoords, setConvertedCoords] = useState<
      PrettyProjected | PrettyCoordinates | undefined
    >();

    useEffect(() => {
      const disposer = mouseCoords.updateEvent.addEventListener(() => {
        projectCoordinates();
      });
      return disposer;
    }, [mouseCoords]);

    const changeProjection = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const projection = terria.projections.find(
        (p) => p.params.id === e.target.value
      );
      if (projection) {
        runInAction(() => {
          terria.projection = projection;
          terria.setLocalProperty("projection", projection.params.id);
          projectCoordinates();
        });
      }
    };

    const projectCoordinates = () => {
      const { cartographic, elevation } = mouseCoords;

      const convertedCoords = cartographic
        ? terria.projection.project(cartographic!, elevation)
        : undefined;

      setConvertedCoords(convertedCoords);
    };

    const openCoordinateSearchTool = () => {
      const tool = {
        toolName: "Coordinate search",
        getToolComponent: () =>
          import("../../Tools/CoordinateSearch/CoordinateSearch").then(
            (m) => m.default
          ) as any,
        showCloseButton: false
      };

      if (
        viewState.currentTool &&
        viewState.currentTool.toolName === tool.toolName
      ) {
        viewState.closeTool();
      } else {
        viewState.openTool(tool);
      }
    };

    if (!convertedCoords) return null;

    return (
      <Box
        styledHeight="30px"
        col
        verticalCenter
        css={`
          padding: 3px 0;
        `}
      >
        <Select
          value={terria.projection.params.id}
          onChange={changeProjection}
          boxProps={{ styledHeight: "100%" }}
          dropdownIconProps={{ css: `width: 10px` }}
          css={`
            min-height: 100%;
            background: transparent;
            font-size: 0.7rem;
          `}
        >
          {terria.projections.map((p) => (
            <option key={p.params.id} value={p.params.id}>
              {p.params.id}
            </option>
          ))}
        </Select>
        <Box
          verticalCenter
          fullHeight
          css={`
            &:hover {
              background: ${theme.colorPrimary};
              cursor: pointer;
            }
          `}
          onClick={openCoordinateSearchTool}
          ref={locationBarRef}
        >
          {convertedCoords.type === "projected" ? (
            <>
              {convertedCoords.zone && (
                <SectionSmall centered>
                  <StyledText>{t("legend.zone")}</StyledText>
                  <StyledText>{convertedCoords.zone}</StyledText>
                </SectionSmall>
              )}
              <Section centered>
                <StyledText>
                  {applyTranslationIfExists(
                    terria.projection.params.firstAxisName || "E",
                    i18n
                  )}
                </StyledText>
                <StyledText>{convertedCoords.east}</StyledText>
              </Section>

              <Section>
                <StyledText>
                  {applyTranslationIfExists(
                    terria.projection.params.secondAxisName || "N",
                    i18n
                  )}
                </StyledText>
                <StyledText>{convertedCoords.north}</StyledText>
              </Section>
              {convertedCoords.elevation && (
                <Section>
                  <StyledText>{t("legend.elev")}</StyledText>
                  <StyledText>{convertedCoords.elevation}</StyledText>
                </Section>
              )}
            </>
          ) : (
            <>
              <Section centered>
                <StyledText>
                  {applyTranslationIfExists(
                    terria.projection.params.firstAxisName || "Lat",
                    i18n
                  )}
                </StyledText>
                <StyledText>{convertedCoords.latitude}</StyledText>
              </Section>

              <Section>
                <StyledText>
                  {applyTranslationIfExists(
                    terria.projection.params.secondAxisName || "Lon",
                    i18n
                  )}
                </StyledText>
                <StyledText>{convertedCoords.longitude}</StyledText>
              </Section>
              {convertedCoords.elevation && (
                <Section>
                  <StyledText>{t("legend.elev")}</StyledText>
                  <StyledText>{convertedCoords.elevation}</StyledText>
                </Section>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }
);

export default LocationBar;
