import React from "react";
import { useTranslation } from "react-i18next";
import { CellProps, Hooks, Row } from "react-table";
import { useTheme } from "styled-components";
import { AttributeTableRowDataProps } from "../../../Models/AttributeTable";
import Box from "../../../Styled/Box";
import { GLYPHS } from "../../../Styled/Icon";
import { ToolIcon } from "../TableStyles";

export const useZoom = (hooks: Hooks<any>) => {
  const theme = useTheme();
  const { t } = useTranslation();
  hooks.allColumns.push((columns, { instance }) => {
    const { onZoomClick } = instance;

    const handleClick = (row: Row) => {
      const original: AttributeTableRowDataProps = row.original;
      onZoomClick(original.uniqueFeatureId!);
    };
    const columnsExtended = [];
    if (instance.canZoomToFeature) {
      columnsExtended.push(
        // Let's make a column for zoom to tool
        {
          id: "_zoom",
          disableResizing: true,
          disableGroupBy: true,
          minWidth: 30,
          width: 30,
          maxWidth: 30,
          canHide: false,
          canResize: false,
          //leave the header empty
          Header: "",
          sticky: true,

          Cell: ({ row, cell }: CellProps<any>) => (
            <Box
              onClick={() => {
                handleClick(row);
              }}
              css={"display: block"}
            >
              <ToolIcon theme={theme} glyph={GLYPHS.zoomTo} />
            </Box>
          )
        }
      );
    }
    columnsExtended.push(...columns);
    return columnsExtended;
  });
};
