import styled from "styled-components";
import { StyledIcon } from "./../../Styled/Icon";
import Text from "../../Styled/Text";

interface ICellProps {
  sticky: boolean;
}

const Cell = styled(Text)<ICellProps>`
  text-align: left;
  vertical-align: inherit;
  border-right: 1px solid ${(props) => props.theme.greyLighter};
  &:last-child {
    border-right: none;
  }
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: inherit;
  ${(props) =>
    props.sticky &&
    `
    position: sticky !important;
    left: 0;
    z-index: 2;
  `}
`;

export const TableElement = styled(Text)`
  border-spacing: 0;
  overflow: auto;
  min-width: 100%;
  -webkit-overflow-scrolling: touch;
  background-color: ${(props) => props.theme.textLight};

  &::-webkit-scrollbar {
    width: 10px; /* for vertical scrollbars */
    height: 8px; /* for horizontal scrollbars */
  }

  &::-webkit-scrollbar-track {
    background: rgba(136, 136, 136, 0.1);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(136, 136, 136, 0.6);
  }

  -webkit-user-select: none; /* Chrome all / Safari all */
  -moz-user-select: none; /* Firefox all */
  -ms-user-select: none; /* IE 10+ */
  user-select: none;
`;

export const HeaderRowWrap = styled(Text)`
  position: sticky;
  z-index: 2;
  background-color: inherit;
  top: 0;
  display: flex;
`;

export const HeaderRowElement = styled(Text)`
  outline: 0;
  vertical-align: middle;
  border-bottom: 1px solid ${(props) => props.theme.greyLighter};
  background-color: inherit;
  box-shadow: 0 0 4px 0 #ddd;
  &:hover [role="separator"] {
    opacity: 1;
  }
`;

export const HeaderCell = styled(Cell)``;

export const CellContent = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding: 5px;
`;

interface IHeaderCellContentProps {
  sorted: boolean;
}

export const HeaderCellContent = styled(CellContent)<IHeaderCellContentProps>`
  padding: 0;
  display: flex;
  padding-right: ${(props) => (props.sorted ? 25 : 0)}px;
  &:hover {
    padding-right: 25px;
    svg {
      display: block;
    }
  }
`;

export const TableBody = styled(Text)`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  background-color: inherit;
`;

interface TableRowProps {
  rowSelected: boolean;
}

export const TableRow = styled(Text).attrs((props: TableRowProps) => ({
  bold: props.rowSelected
}))<TableRowProps>`
  cursor: pointer;
  color: inherit;
  outline: 0;
  vertical-align: middle;
  border-bottom: 1px solid ${(props) => props.theme.greyLighter};
  min-width: 100%;
  background-color: inherit;
  &:hover {
    background-color: ${(props) => props.theme.greyLighter};
    color: ${(props) => props.theme.colorPrimary};
  }
  ${(props) =>
    props.rowSelected &&
    `
    background-color: ${props.theme.greyLighter};
    color: ${props.theme.colorPrimary};
  `}
`;

export const TableCell = styled(Cell)`
  font-weight: inherit;
`;

export const ToolIcon = styled(StyledIcon).attrs({
  dark: true,
  styledWidth: "100%"
})`
  padding: 5px;
  &:hover {
    fill: ${(props) => props.theme.colorPrimary};
  }
`;

interface ResizerProps {
  isResizing: boolean;
}

export const Resizer = styled.div<ResizerProps>`
  cursor: col-resize;
  top: 25%;
  right: -2px;
  width: 3px;
  height: 50%;
  opacity: 0;
  z-index: 3;
  position: absolute;
  transition: all linear 100ms;
  border-left: 1px solid ${(props) => props.theme.colorSecondary};
  border-right: 1px solid ${(props) => props.theme.colorSecondary};
  ${(props) =>
    props.isResizing &&
    `
    opacity: 1;
    top: 2px;
    right: -1px;
    width: 1px;
    border: none;
    height: calc(100% - 4px);
    background-color: ${props.theme.colorSecondary};
  `}
`;

export const FilterCell = styled(CellContent)`
  border-top: 1px solid ${(props) => props.theme.greyLighter};
`;

export const FilterInput = styled.input`
  box-sizing: border-box;
  width: 100%;
`;

interface SortIconProps {
  sorted: boolean;
}

export const SortIcon = styled(StyledIcon)<SortIconProps>`
  position: absolute;
  right: 5px;
  top: 5px;
  display: ${(props) => (props.sorted ? "block" : "none")};
`;
