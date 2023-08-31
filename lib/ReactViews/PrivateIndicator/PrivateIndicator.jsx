import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Icon from "../../Styled/Icon";
import { BoxSpan } from "../../Styled/Box";

PrivateIndicator.propTypes = {
  inWorkbench: PropTypes.bool
};

export default function PrivateIndicator(props) {
  const { t } = useTranslation();

  return (
    <BoxSpan centered title={t("catalogItem.privateIndicatorTitle")}>
      <Icon
        glyph={Icon.GLYPHS.lock}
        css={`
          width: 15px;
          height: 15px;
          fill: currentColor;
        `}
        {...props}
      />
    </BoxSpan>
  );
}
