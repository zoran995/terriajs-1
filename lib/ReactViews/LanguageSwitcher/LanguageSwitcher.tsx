import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import ViewState from "../../ReactViewModels/ViewState";
import { useRefForTerria } from "../Hooks/useRefForTerria";
import MapIconButton from "../MapIconButton/MapIconButton";
import Icon, { GLYPHS, StyledIcon } from "./../../Styled/Icon";
import LanguageSwitcherContent from "./LanguageSwitcherContent";
import Box, { BoxSpan } from "../../Styled/Box";
import { TextSpan } from "../../Styled/Text";

export enum Direction {
  Up = 0,
  Down = 1
}

interface PropsType {
  viewState: ViewState;
  neverCollapse?: boolean;
  direction?: Direction;
  primary?: boolean;
  dark?: boolean;
  navigation?: boolean;
  hideArrowIcon?: boolean;
  styledMinWidth?: string;
}

export const LANGUAGE_SWITCHER_NAME = "MapNavigationLanguageSwitcher";

const LanguageSwitcher: React.FC<PropsType> = (props: PropsType) => {
  const [isOpen, setIsOpen] = useState(false);
  const up = defaultValue(props.direction === Direction.Up, false);
  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    setIsOpen(!isOpen);
    window.addEventListener("click", closeMenu);
  }

  function closeMenu() {
    setIsOpen(false);
    window.removeEventListener("click", closeMenu);
  }

  const supportedLanguages =
    props.viewState.terria.configParameters.languageConfiguration?.languages;
  if (!supportedLanguages || Object.keys(supportedLanguages).length === 1)
    return null;

  const languageSwitcherRef: React.RefObject<HTMLElement> | undefined =
    (useRefForTerria(LANGUAGE_SWITCHER_NAME, props.viewState) as any) ||
    undefined;

  const [t, i18n] = useTranslation();
  const currentLanguage = i18n.language;
  const languageName = supportedLanguages[currentLanguage];
  const opened = up ? GLYPHS.opened : GLYPHS.closed;
  const closed = up ? GLYPHS.closed : GLYPHS.opened;
  return (
    <Box alignItemsFlexEnd={up}>
      <Box fullWidth>
        <MapIconButton
          primary={isOpen}
          dark={props.dark}
          buttonRef={props.navigation ? languageSwitcherRef : undefined}
          className={undefined}
          onClick={openMenu}
          title={i18n.language}
          iconElement={() => <Icon glyph={GLYPHS.globe} />}
          expandInPlace={!props.neverCollapse}
          neverCollapse={isOpen || props.neverCollapse}
          css={`
            ${isOpen &&
            `border-radius: ${up ? "0 0 16px 16px" : "16px 16px 0 0"}`};
            ${props.styledMinWidth && `min-width: ${props.styledMinWidth};`}
          `}
        >
          {isOpen && (
            <LanguageSwitcherContent
              isOpen={isOpen}
              closeMenu={closeMenu}
              supportedLanguages={supportedLanguages}
              up={up}
              viewState={props.viewState}
            />
          )}
          <BoxSpan centered justifySpaceBetween>
            {!props.hideArrowIcon && (
              <StyledIcon
                // (You need light text on a dark theme, and vice versa)
                //fillColor={isLightTheme ? theme.textDarker : false}
                //light={isDarkTheme}
                styledWidth="10px!important"
                glyph={isOpen ? opened : closed}
                css={`
                  width: 10px;
                `}
              />
            )}
            <TextSpan noFontSize textAlignLeft>
              {languageName}
            </TextSpan>
          </BoxSpan>
        </MapIconButton>
      </Box>
    </Box>
  );
};

export default LanguageSwitcher;
