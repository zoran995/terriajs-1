"use strict";
import i18next from "i18next";
import React from "react";
import styled, { useTheme } from "styled-components";
import Box from "../../Styled/Box";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import { useViewState } from "../Context";

const BrandingBox = styled(Box)`
  @media (min-width: ${(props) => props.theme.sm}px) {
    width: 100%;
    padding: 0 5px;
    height: ${(props) => props.theme.logoHeight};
  }
`;

const A = styled.a`
  text-decoration: none;
`;

interface BrandingProps {
  version: string;
}

const Branding: React.FC<BrandingProps> = (props) => {
  const viewState = useViewState();
  const theme = useTheme();
  return (
    <BrandingBox styledHeight={theme.inputHeight} overflow={"hidden"} left>
      <A target="_blank">
        <Box fullWidth>
          <Box paddedHorizontally={2}>
            {i18next.language === "sr-Cyrl" ? (
              <StyledIcon
                styledWidth={
                  viewState.useSmallScreenInterface ? "150px" : "250px"
                }
                light
                strokeLight
                glyph={GLYPHS.logoGeoportalCyr}
              />
            ) : (
              <StyledIcon
                styledWidth={
                  viewState.useSmallScreenInterface ? "150px" : "250px"
                }
                light
                strokeLight
                glyph={GLYPHS.logoGeoportalLat}
              />
            )}
          </Box>
        </Box>
      </A>
    </BrandingBox>
  );
};

export default Branding;
