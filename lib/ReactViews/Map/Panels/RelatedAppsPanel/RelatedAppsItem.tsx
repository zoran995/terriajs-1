import { TFunction } from "i18next";
import React from "react";
import {
  withTranslation,
  WithTranslation,
  useTranslation
} from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import isDefined from "../../../../Core/isDefined";
import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import { GLYPHS, StyledIcon } from "../../../../Styled/Icon";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";

const TextP = styled(Text).attrs({
  as: "p"
})``;

export interface RelatedAppsItemType {
  title: string;
  imageUrl: string;
  description: string;
  targetUrl: string;
}

interface PropsType extends WithTranslation {
  viewState: ViewState;
  theme: DefaultTheme;
  content: RelatedAppsItemType;
  lastItem: boolean;
}

class RelatedAppsItem extends React.Component<PropsType> {
  static displayName: "RelatedAppsItem";

  constructor(props: PropsType) {
    super(props);
  }

  render() {
    const { t, content } = this.props;

    return (
      <Box fullWidth paddedHorizontally={4}>
        {content.targetUrl ? (
          <StyledLink target="_blank" href={`${content.targetUrl}`}>
            <AppItem
              title={content.title || ""}
              urlDefined={
                isDefined(content.targetUrl) && content.targetUrl.length > 0
              }
              imageUrl={content.imageUrl}
              lastItem={this.props.lastItem}
              theme={this.props.theme}
            />
          </StyledLink>
        ) : (
          <AppItem
            title={content.title || ""}
            urlDefined={
              isDefined(content.targetUrl) && content.targetUrl.length > 0
            }
            imageUrl={content.imageUrl}
            lastItem={this.props.lastItem}
            theme={this.props.theme}
          />
        )}
      </Box>
    );
  }
}

interface AppItemProps {
  urlDefined: boolean;
  title: string;
  imageUrl: string;
  theme: DefaultTheme;
  lastItem: boolean;
}

const AppItem: React.FC<AppItemProps> = (props) => {
  const { i18n } = useTranslation();
  const { imageUrl, title } = props;
  return (
    <Box fullWidth>
      <Box
        fullWidth
        paddedVertically={2}
        css={`
          ${!props.lastItem &&
          `border-bottom: 2px solid ${props.theme.textDark};`}
          &:hover {
            background: #084380;
            svg {
              fill: ${props.theme.textLight};
            }
            svg.arrow-right {
              fill: ${props.theme.textLight};
            }
            color: ${props.theme.textLight};
          }
        `}
      >
        <Box paddedRatio={2} fullWidth>
          <IconWrapper>
            {imageUrl && (
              <StyledIcon styledWidth={"50px"} glyph={{ id: imageUrl }} />
            )}
            {/* <img
              src={imageUrl}
              title={applyTranslationIfExists(title, i18n)}
              alt={applyTranslationIfExists(title, i18n)}
              css={`
                width: 50px;
                height: 50px;
              `}
            ></img>   */}
          </IconWrapper>
          <Spacing right={3} />
          <Box verticalCenter fullWidth>
            <Box paddedHorizontally={2} fullWidth>
              <Text
                semiBold
                extraExtraLarge
                css={`
                  overflow-wrap: anywhere;
                `}
              >
                {applyTranslationIfExists(title, i18n)}
              </Text>
            </Box>
            <Box right>
              {props.urlDefined && (
                <StyledIcon
                  className="arrow-right"
                  light
                  styledWidth={"15px"}
                  glyph={GLYPHS.arrowRight}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const IconWrapper = styled(Box)`
  svg {
    fill: ${(props) => props.theme.darkLighter};
  }
`;

const StyledLink = styled.a`
  ${(p: any) => p.theme.textLight && `color: ${p.theme.textLight};`}
  text-decoration: none;
  width: 100%;
`;

export default withTranslation()(withTheme(RelatedAppsItem));
