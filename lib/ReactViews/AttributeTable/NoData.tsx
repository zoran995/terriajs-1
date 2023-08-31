import React from "react";
import { useTranslation } from "react-i18next";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";

interface NoDataProps {
  charcoalGreyBg?: boolean;
  message?: string;
}

export const NoData: React.FC<NoDataProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Box
      centered
      fullWidth
      paddedVertically={10}
      charcoalGreyBg={props.charcoalGreyBg}
    >
      <Text extraBold extraExtraLarge textLight={props.charcoalGreyBg}>
        {props.message ? props.message : t("attributeTable.noData")}
      </Text>
    </Box>
  );
};
