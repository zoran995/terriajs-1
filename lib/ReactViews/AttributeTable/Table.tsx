import React, { PropsWithChildren, ReactElement, useRef } from "react";
import {
  TableOptions,
  useColumnOrder,
  useExpanded,
  useFilters,
  useFlexLayout,
  useGlobalFilter,
  usePagination,
  useResizeColumns,
  useRowSelect,
  useSortBy,
  useTable,
  CellProps,
  FilterTypes
} from "react-table";
import { useVirtual } from "react-virtual";
import { useTheme } from "styled-components";
import isDefined from "../../Core/isDefined";
import { AttributeTableRowDataProps } from "../../Models/AttributeTable";
import { GLYPHS } from "../../Styled/Icon";
import { numericFilter } from "./Filter/NumericFilter";
import { useZoom } from "./hooks/useZoom";
import { NoData } from "./NoData";
import { SortIcon } from "./TableStyles";
import { useLocalStorage } from "./Utils/useLocalStorage";
import { useTranslation } from "react-i18next";

const DefaultColumnFilter: any =
  require("./Filter/DefaultColumnFilter").default;
const TableElement: any = require("./TableStyles").TableElement;
const HeaderRowWrap: any = require("./TableStyles").HeaderRowWrap;
const HeaderRowElement: any = require("./TableStyles").HeaderRowElement;
const HeaderCell: any = require("./TableStyles").HeaderCell;
const TableBody: any = require("./TableStyles").TableBody;
const TableRow: any = require("./TableStyles").TableRow;
const TableCell: any = require("./TableStyles").TableCell;
const CellContent: any = require("./TableStyles").CellContent;
const HeaderCellContent: any = require("./TableStyles").HeaderCellContent;
const Resizer: any = require("./TableStyles").Resizer;
const FilterCell: any = require("./TableStyles").FilterCell;

export interface TableProps<T extends object = {}> extends TableOptions<T> {
  name: string;
  columns: any;
}

const CellRender: React.FC<CellProps<any>> = ({ cell }) => {
  const value = cell.value;
  const text =
    value instanceof Object ? JSON.stringify(value) : value?.toString();
  const theme = useTheme();
  return <CellContent>{text}</CellContent>;
};

const defaultColumn = {
  Filter: DefaultColumnFilter,
  Cell: CellRender,
  // When using the useFlexLayout:
  minWidth: 30, // minWidth is only used as a limit for resizing
  width: 150, // width is used for both the flex-basis and flex-grow
  maxWidth: 200, // maxWidth is only used as a limit for resizing
  canHide: true, // custom prop used to determine if column can be hidden
  filter: "text"
};

const hooks = [
  useColumnOrder,
  useFilters,
  useGlobalFilter,
  useSortBy,
  useExpanded,
  useResizeColumns,
  useFlexLayout,
  usePagination,
  useRowSelect,
  useZoom
];

export function Table<T extends object>(
  props: PropsWithChildren<TableProps<T>>
): ReactElement {
  const { name, columns, onRowClick, manualRowSelectedKey } = props;
  const tableContainerRef = useRef();
  const [initialState, setInitialState] = useLocalStorage(
    `tableState:${name}`,
    {}
  );

  const filterTypes: any = {
    numeric: numericFilter,
    text: numericFilter
  };

  const instance = useTable<T>(
    {
      ...props,
      columns,
      filterTypes,
      defaultColumn,
      initialState,
      autoResetSortBy: false,
      autoResetFilters: false
    },
    ...hooks
  );

  const {
    getTableProps,
    headerGroups,
    rows,
    toggleAllRowsSelected,
    prepareRow,
    getTableBodyProps
  } = instance;
  /*   const debouncedState = useDebounce(state, 500);

  useEffect(() => {
    const {
      sortBy,
      filters,
      pageSize,
      columnResizing,
      hiddenColumns
    } = debouncedState;
    const val = {
      sortBy,
      filters,
      pageSize,
      columnResizing,
      hiddenColumns
    };
    setInitialState(val);
  }, [setInitialState, debouncedState]); */

  const rowVirtualizer = useVirtual({
    size: rows.length,
    parentRef: tableContainerRef,
    estimateSize: React.useCallback(() => 30, []),
    overscan: 5
  });

  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <TableElement
      {...getTableProps()}
      style={{ height: "200px" }}
      ref={tableContainerRef}
      theme={theme}
    >
      <HeaderRowWrap>
        {headerGroups.map((headerGroup) => (
          <HeaderRowElement
            {...headerGroup.getHeaderGroupProps()}
            theme={theme}
          >
            {headerGroup.headers.map((column) => {
              return (
                <HeaderCell
                  bold
                  {...column.getHeaderProps()}
                  theme={theme}
                  sticky={column.sticky}
                >
                  <HeaderCellContent
                    {...column.getSortByToggleProps()}
                    title={column.render("Header")}
                    sorted={column.isSorted}
                  >
                    <CellContent>{column.render("Header")}</CellContent>
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <SortIcon
                          styledWidth="20px"
                          dark
                          glyph={GLYPHS.arrowDesc}
                          sorted={column.isSorted}
                        />
                      ) : (
                        <SortIcon
                          styledWidth="20px"
                          dark
                          glyph={GLYPHS.arrowAsc}
                          sorted={column.isSorted}
                        />
                      )
                    ) : (
                      <SortIcon
                        styledWidth="20px"
                        dark
                        glyph={GLYPHS.arrowSort}
                        sorted={column.isSorted}
                      />
                    )}
                    {column.canResize && (
                      <Resizer
                        {...column.getResizerProps()}
                        style={{ cursor: "col-resize" }}
                        isResizing={column.isResizing}
                        theme={theme}
                      />
                    )}
                  </HeaderCellContent>
                  {column.canFilter && (
                    <FilterCell theme={theme}>
                      {column.render("Filter")}
                    </FilterCell>
                  )}
                </HeaderCell>
              );
            })}
          </HeaderRowElement>
        ))}
      </HeaderRowWrap>
      <TableBody
        {...getTableBodyProps()}
        style={{
          height: `${rowVirtualizer.totalSize}px`,
          position: "relative"
        }}
      >
        {rows.length === 0 ? (
          <NoData />
        ) : (
          rowVirtualizer.virtualItems.map((vRow) => {
            const rowIndex = vRow.index;
            const row = rows[rowIndex];
            row && prepareRow(row);
            const originalRow: AttributeTableRowDataProps = row.original;
            if (isDefined(originalRow.isSelected)) {
              row.isSelected = originalRow.isSelected;
            }
            return (
              <TableRow
                {...row.getRowProps()}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: `${vRow.size}px`,
                  transform: `translateY(${vRow.start}px)`,
                  display: "flex",
                  flex: "1 0 auto"
                }}
                rowSelected={row.isSelected}
                onClick={() => {
                  toggleAllRowsSelected(false);
                  row.toggleRowSelected();
                  const originalRow: AttributeTableRowDataProps = row.original;
                  if (originalRow.uniqueFeatureId) {
                    onRowClick(originalRow.uniqueFeatureId);
                  }
                }}
                theme={theme}
                key={vRow.index}
              >
                {row.cells.map((cell) => {
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      title={t("attributeTable.zoomToFeature")}
                      sticky={cell.column.sticky}
                    >
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </TableElement>
  );
}
