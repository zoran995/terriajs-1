import i18next from "i18next";
import { runInAction } from "mobx";
import React from "react";
import ViewState from "../../ReactViewModels/ViewState";
import Box from "../../Styled/Box";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Select from "../../Styled/Select";
import { Language } from "./LanguageSwitcherContent";

interface PropsType {
  viewState: ViewState;
  center?: boolean;
  selectProps?: any;
  hideIcon?: boolean;
  aditionalAction?: () => void;
}

const LanguageSwitcherSelect: React.FC<PropsType> = (props) => {
  const terria = props.viewState.terria;
  const currentLanguage = i18next.language;
  const supportedLanguages =
    terria.configParameters.languageConfiguration?.languages;
  if (!supportedLanguages || Object.keys(supportedLanguages).length === 1)
    return null;

  const availableLanguages = Object.keys(supportedLanguages).map((key) => {
    return {
      language: key,
      name: supportedLanguages[key]
    };
  });

  function changeLanguage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const value = event.currentTarget.value;
    if (availableLanguages.filter((e) => e.language === value)) {
      runInAction(() => {
        props.viewState.currentLanguage = value;
      });
      if (props.aditionalAction) props.aditionalAction();
    }
  }

  return (
    <Select
      onChange={changeLanguage}
      leftIcon={() =>
        props.hideIcon ? null : (
          <Box
            paddedHorizontally={1}
            css={`
              margin-left: 10px;
            `}
          >
            <StyledIcon glyph={GLYPHS.globe} styledWidth="20px" />
          </Box>
        )
      }
      value={currentLanguage}
      viewState={props.viewState}
      paddingForLeftIcon="40px"
      light
      css={`
        border-radius: 20px;
        ${props.center &&
        `text-align-last: center;
        -moz-text-align-last: center;`}
        ${props.selectProps && props.selectProps.css}
      `}
      dropdownIconProps={{
        css: `margin-right: 5px;`
      }}
    >
      {availableLanguages.map((language: Language, index: number) => (
        <option key={language.language} value={language.language}>
          {language.name}
        </option>
      ))}
    </Select>
  );
};

export default LanguageSwitcherSelect;
