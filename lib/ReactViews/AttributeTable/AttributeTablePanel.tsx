import { observer } from "mobx-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import isDefined from "../../Core/isDefined";
import AttributeTableMixin from "../../ModelMixins/AttributeTableMixin";
import GeoJsonCatalogItem from "../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { useViewState } from "../Context";
import CsvCatalogItem from "./../../Models/Catalog/CatalogItems/CsvCatalogItem";
import { NoData } from "./NoData";
import { Table } from "./Table";
import { BaseModel } from "../../Models/Definition/Model";

interface PropsType {
  sourceItem?: BaseModel;
}

const AttributeTable: React.FC<PropsType> = observer(({ sourceItem }) => {
  const viewState = useViewState();

  if (!isDefined(sourceItem) || !AttributeTableMixin.isMixedInto(sourceItem)) {
    return (
      <AttributeTablePanel>
        <NoData charcoalGreyBg />
      </AttributeTablePanel>
    );
  }
  const attributeTable = sourceItem.attributeTable;
  const columns = attributeTable?.columns ?? [];
  const data = attributeTable?.data.map((r) => r.values) ?? [];
  const columnsMemo = React.useMemo(() => columns, [columns]);
  const dataMemo = React.useMemo(() => data, [data]);

  const zoomToFeature = (id: string) => {
    if (sourceItem.zoomToFeature) {
      sourceItem.zoomToFeature(id);
    }
  };

  const hasData = data.length > 0 && columns.length > 0;
  const canZoomToFeature: boolean = !!attributeTable?.canZoomToFeature;

  const onRowClick = (id: string) => {
    if (sourceItem.selectWithId) {
      sourceItem.selectWithId(id);
    }
    viewState.terria.mainViewer.currentViewer.notifyRepaintRequired();
  };
  return (
    <AttributeTablePanel name={(sourceItem as any).name}>
      {!hasData && <NoData charcoalGreyBg />}
      {hasData && (
        <Box fullHeight column backgroundColor={"white"}>
          <Table
            name={"Attribute table"}
            columns={columnsMemo}
            data={dataMemo}
            onZoomClick={zoomToFeature}
            canZoomToFeature={canZoomToFeature}
            onRowClick={onRowClick}
            manualRowSelectedKey={"isSelected"}
          />
        </Box>
      )}
    </AttributeTablePanel>
  );
});

interface AttributeTablePanelProps {
  name?: string;
}

const AttributeTablePanel: React.FC<AttributeTablePanelProps> = ({
  name,
  children
}) => {
  const [showChildren, setShowChildren] = useState(true);

  const { t } = useTranslation();
  const viewState = useViewState();
  const theme = useTheme();

  const onExit = (): void => {
    viewState.closeAttributeTable();
  };

  return (
    <AttributeTablePanelWrapper
      isMapFullScreen={viewState.isMapFullScreen}
      isStoryBuilderShown={viewState.storyBuilderShown}
      column
      useSmallScreenInterface={viewState.useSmallScreenInterface}
    >
      <Box
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.charcoalGrey}
      >
        <Box centered>
          <StyledIcon
            styledWidth="20px"
            light
            strokeLight
            glyph={GLYPHS.table}
          />
          <Spacing right={1} />
          {/* font-size is non standard with what we have so far in terria,
          lineheight as well to hit nonstandard paddings */}
          <Text css={"font-size: 17px;line-height: 26px;"} textLight>
            {t("attributeTable.title", {
              name: name
            })}
          </Text>
        </Box>
        {/* margin-right 5px for the padded button offset - larger click area
        but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <RawButton onClick={() => onExit()}>
            <Text textLight small semiBold uppercase>
              {t("attributeTable.close")}
            </Text>
          </RawButton>
          <Spacing right={1} />
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <Box paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </Box>
          </RawButton>
        </Box>
      </Box>
      {showChildren && children}
    </AttributeTablePanelWrapper>
  );
};

interface AttributeTablePanelWrapperProps {
  isMapFullScreen?: boolean;
  useSmallScreenInterface?: boolean;
  isStoryBuilderShown?: boolean;
}

const AttributeTablePanelWrapper = styled(Box).attrs({
  column: true
})<AttributeTablePanelWrapperProps>`
  left: 0;
  bottom: 0;
  /*
    margin-left: ${(props) =>
    props.isMapFullScreen ? 0 : parseInt(props.theme.workbenchWidth)}px;
  */
  transition: margin-left 0.25s;
  max-height: 300px;
  z-index: 10;

  width: calc(
    100vw -
      ${(props) =>
        props.isMapFullScreen || props.useSmallScreenInterface
          ? 0
          : parseInt(props.theme.workbenchWidth)}px -
      ${(props) => (props.isStoryBuilderShown ? 300 : 0)}px
  );
`;
export default AttributeTable;
