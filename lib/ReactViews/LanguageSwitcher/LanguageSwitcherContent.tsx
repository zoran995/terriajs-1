import i18next, { TFunction } from "i18next";
import { action, makeObservable } from "mobx";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import Ul from "../../Styled/List";
import { RawButton } from "../../Styled/Button";
import Box, { BoxSpan } from "../../Styled/Box";
import { TextSpan } from "../../Styled/Text";
import Hr from "../../Styled/Hr";
import { SpacingSpan } from "../../Styled/Spacing";

const StyledUl = styled(Ul)`
  flex-direction: column;
  padding: 0;
`;

interface PropsType extends WithTranslation {
  t: TFunction;
  isOpen: boolean;
  theme: DefaultTheme;
  supportedLanguages: { [key: string]: string };
  closeMenu(): void;
  up: boolean;
  viewState: ViewState;
}

export interface Language {
  language: string;
  name: string;
}

const RawButtonAndHighlight = styled(RawButton).attrs({
  as: "span"
})`
  ${(p) => `
  &:hover, &:focus {
    background-color: ${p.theme.greyLighter};
  }`}
`;

class LanguageSwitcherContent extends React.Component<PropsType> {
  readonly supportedLanguages: Language[];
  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
    this.supportedLanguages = Object.keys(props.supportedLanguages).map(
      (key) => {
        return {
          language: key,
          name: props.supportedLanguages[key]
        };
      }
    );
  }

  @action
  changeLanguage(event: React.MouseEvent<HTMLSpanElement>) {
    event.stopPropagation();
    const value = event.currentTarget.lang;
    if (this.supportedLanguages.filter((e) => e.language === value)) {
      this.props.viewState.currentLanguage = value;
    }

    this.props.closeMenu();
  }

  render() {
    if (!this.props.isOpen) return null;
    const { t, theme } = this.props;
    const currentLanguage = i18next.language;
    const availableLanguage = this.supportedLanguages.filter(
      (e) => e.language != currentLanguage
    );

    return (
      <Box
        fullWidth
        position="absolute"
        css={`
          ${this.props.isOpen &&
          `border-radius: ${
            this.props.up ? "16px 16px 0 0" : "0 0 16px 16px"
          }`};
          ${this.props.up
            ? `
          bottom: 26px;
          right: 0px;`
            : `
          top: 26px;
          right: 0px;`}
        `}
        backgroundColor={theme.textLight}
        column
      >
        <StyledUl>
          {availableLanguage.map((language: Language, index: number) => {
            const isLastItem = this.props.up
              ? index === 0
              : index === availableLanguage.length - 1;
            return (
              <li key={language.language}>
                <Box>
                  <RawButtonAndHighlight
                    fullWidth
                    onClick={this.changeLanguage.bind(this)}
                    value={language.language}
                    lang={language.language}
                    css={`
                      ${isLastItem &&
                      `border-radius: ${
                        this.props.up ? "16px 16px 0 0" : "0 0 16px 16px"
                      }`};
                    `}
                  >
                    {!isLastItem && this.props.up && (
                      <BoxSpan>
                        <SpacingSpan right={2} />
                        <Hr
                          size={1}
                          fullWidth
                          borderBottomColor={theme.greyLighter}
                        />
                        <SpacingSpan right={2} />
                      </BoxSpan>
                    )}
                    <TextSpan breakWord large textDark>
                      <BoxSpan
                        paddedRatio={1.2}
                        paddedHorizontally={2}
                        centered
                      >
                        {language.name}
                      </BoxSpan>
                    </TextSpan>
                    {!isLastItem && !this.props.up && (
                      <BoxSpan>
                        <SpacingSpan right={2} />
                        <Hr
                          size={1}
                          fullWidth
                          borderBottomColor={theme.greyLighter}
                        />
                        <SpacingSpan right={2} />
                      </BoxSpan>
                    )}
                  </RawButtonAndHighlight>
                </Box>
              </li>
            );
          })}
        </StyledUl>
        {/* {supportedLngs.map(language => (
          
        ))} */}
      </Box>
    );
  }
}

export default withTranslation()(withTheme(LanguageSwitcherContent));
