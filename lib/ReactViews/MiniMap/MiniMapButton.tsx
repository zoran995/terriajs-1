import { runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation, useTranslation } from "react-i18next";
import styled, { useTheme, withTheme } from "styled-components";
import { RawButton } from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import MiniMapPanel from "./MiniMapPanel";
import Terria from "./../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";

interface IMiniMapButtonProps {
  viewState: ViewState;
}

const MiniMapButton: React.FC<IMiniMapButtonProps> = observer(
  ({ viewState }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const opened = viewState.miniMapIsVisible;
    const { terria } = viewState;

    const onClick = () => {
      runInAction(() => {
        viewState.miniMapIsVisible = !viewState.miniMapIsVisible;
      });
    };

    return (
      <StyledMiniMap>
        <StyledMiniMapButton
          title={opened ? t("miniMap.hide") : t("miniMap.show")}
          onClick={onClick}
        >
          {opened ? (
            <StyledIcon
              fillColor={theme.textDarker}
              glyph={Icon.GLYPHS.miniMapOpened}
            />
          ) : (
            <StyledIcon
              fillColor={theme.textDarker}
              glyph={Icon.GLYPHS.miniMapClosed}
            />
          )}
        </StyledMiniMapButton>
        {opened && <MiniMapPanel terria={terria} />}
      </StyledMiniMap>
    );
  }
);

const StyledMiniMap = styled.div`
  background-color: unset;
  display: none;
  position: relative;
  float: left;
  @media (min-width: ${(props) => props.theme.sm}px) {
    display: block;
  }
  margin-top: 3px;
  margin-bottom: 3px;
`;

const StyledMiniMapButton = styled(RawButton)`
  
  background: ${(props) => props.theme.charcoalGrey}
  color: ${(props) => props.theme.textLight};
  :hover {
    background: ${(props) => props.theme.colorPrimary}
  }
  svg {
    fill: ${(props) => props.theme.textLight};
    height: 100%;
    width: 100%;
    margin: auto;
  }
  margin: 0 auto;
  max-width: 20px;
  padding: 3px;
`;

export default MiniMapButton;
