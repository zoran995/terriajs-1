import React, { FC } from "react";
import { useTranslation } from "react-i18next";

import { BoxSpan } from "../../Styled/Box";
import Icon from "../../Styled/Icon";
import { applyTranslationIfExists } from "../../Language/languageHelpers";

interface IShopIndicatorProps {
  title?: string;
  type?: "icon" | "button";
}

export const ShopIndicator: FC<IShopIndicatorProps> = ({
  title = "translate#geoshop.indicatorTitle",
  type = "icon"
}) => {
  const { i18n } = useTranslation();

  const translatedTitle = applyTranslationIfExists(title, i18n);
  return (
    <BoxSpan centered title={translatedTitle}>
      {type === "icon" ? (
        <Icon
          glyph={Icon.GLYPHS.shoppingCart}
          css={`
            width: 15px;
            height: 15px;
            fill: currentColor;
          `}
        />
      ) : null}
    </BoxSpan>
  );
};
