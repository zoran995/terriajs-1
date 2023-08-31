import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon from "../../Styled/Icon";
import Text from "../../Styled/Text";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import { ShopIndicator } from "../ShopIndicator/ShopIndicator";
import { useTheme } from "styled-components";

export enum ButtonState {
  Loading,
  Remove,
  Add,
  Trash,
  Stats,
  Preview
}

const STATE_TO_ICONS: Record<ButtonState, React.ReactElement> = {
  [ButtonState.Loading]: <Icon glyph={Icon.GLYPHS.loader} />,
  [ButtonState.Remove]: <Icon glyph={Icon.GLYPHS.remove} />,
  [ButtonState.Add]: <Icon glyph={Icon.GLYPHS.add} />,
  [ButtonState.Trash]: <Icon glyph={Icon.GLYPHS.trashcan} />,
  [ButtonState.Stats]: <Icon glyph={Icon.GLYPHS.barChart} />,
  [ButtonState.Preview]: <Icon glyph={Icon.GLYPHS.right} />
};

interface Props {
  isPrivate?: boolean;
  geoshopProductId?: number;
  isGeoShopSelectionAvailable?: boolean;
  title: string;
  text: string;
  selected?: boolean;
  trashable?: boolean;

  btnState: ButtonState;
  onBtnClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTextClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTrashClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  titleOverrides?: Partial<Record<ButtonState, string>>;
}

/** Dumb catalog item */
function CatalogItem(props: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const STATE_TO_TITLE = {
    [ButtonState.Loading]: t("catalogItem.loading"),
    [ButtonState.Remove]: t("catalogItem.remove"),
    [ButtonState.Add]: t("catalogItem.add"),
    [ButtonState.Trash]: t("catalogItem.trash"),
    [ButtonState.Preview]: t("catalogItem.preview")
  };
  const stateToTitle: Partial<Record<ButtonState, string>> = defaultValue(
    props.titleOverrides,
    STATE_TO_TITLE
  );
  return (
    <Root>
      <Text fullWidth primary={props.isPrivate} bold={props.selected} breakWord>
        <ItemTitleButton
          selected={props.selected}
          trashable={props.trashable}
          type="button"
          onClick={props.onTextClick}
          title={props.title}
        >
          {props.text}
        </ItemTitleButton>
      </Text>
      <Box
        gap={2}
        css={`
          padding-right: 5px;
        `}
      >
        {props.geoshopProductId && (
          <StyledLinkIcon
            target="_blank"
            rel="noopener noreferrer"
            href={`https://geoshop.prointer.ba/data/${props.geoshopProductId}`}
          >
            {props.isGeoShopSelectionAvailable && !props.isPrivate ? (
              <ShopIndicator title="translate#geoshop.catalogLinkSelectionTitle" />
            ) : (
              <ShopIndicator title="translate#geoshop.catalogLinkRedirectTitle" />
            )}
          </StyledLinkIcon>
        )}
        {props.isPrivate && (
          <PrivateIndicator
            css={`
              color: ${theme.colorPrimary};
            `}
          />
        )}
        <ActionButton
          type="button"
          onClick={props.onBtnClick}
          title={stateToTitle[props.btnState] || ""}
        >
          {STATE_TO_ICONS[props.btnState]}
        </ActionButton>
        {props.trashable && (
          <ActionButton
            type="button"
            onClick={props.onTrashClick}
            title={stateToTitle[ButtonState.Trash]}
          >
            {STATE_TO_ICONS[ButtonState.Trash]}
          </ActionButton>
        )}
      </Box>
    </Root>
  );
}

const Root = styled.li`
  display: flex;
  width: 100%;
`;

const ItemTitleButton = styled(RawButton)<{
  selected?: boolean;
  trashable?: boolean;
}>`
  text-align: left;
  word-break: normal;
  overflow-wrap: anywhere;
  padding: 8px;
  width: 100%;

  &:focus,
  &:hover {
    color: ${(p) => p.theme.modalHighlight};
    font-weight: 800;
    f
  }

  ${(p) =>
    p.selected &&
    `
    color: ${p.theme.modalHighlight};
    font-weight: 800;
  `}

  @media (max-width: ${(p) => p.theme.sm}px) {
    font-size: 0.9rem;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${(p) => p.theme.greyLighter};
  }
`;

const ActionButton = styled(RawButton)`
  display: flex;
  align-items: center;

  svg {
    height: 20px;
    width: 20px;
    fill: ${(p) => p.theme.charcoalGrey};
  }

  &:hover,
  &:focus {
    svg {
      fill: ${(p) => p.theme.modalHighlight};
    }
  }
`;

const StyledLinkIcon = styled.a`
  display: flex;
  align-items: center;
  color: ${(p) => p.theme.colorPrimary};

  svg {
    height: 18px;
    width: 18px;
  }
`;

CatalogItem.propTypes = {
  onTextClick: PropTypes.func,
  isPrivate: PropTypes.bool,
  selected: PropTypes.bool,
  text: PropTypes.string,
  title: PropTypes.string,
  trashable: PropTypes.bool,
  onTrashClick: PropTypes.func,
  onBtnClick: PropTypes.func,
  btnState: PropTypes.oneOf([
    ButtonState.Add,
    ButtonState.Loading,
    ButtonState.Preview,
    ButtonState.Remove,
    ButtonState.Stats,
    ButtonState.Trash
  ]),
  titleOverrides: PropTypes.object
};

export default CatalogItem;
