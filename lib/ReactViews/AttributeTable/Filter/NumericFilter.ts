import { FilterValue, IdType, Row } from "react-table";

const regex = /([=<>!]*)\s*((?:[0-9].?[0-9]*)+)/;

function parseValue(filterValue: FilterValue) {
  const defaultCompare = (rowValue: any) =>
    String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());

  const tokens = regex.exec(filterValue);
  if (!tokens) {
    return defaultCompare;
  }
  switch (tokens[1]) {
    case ">":
      return (val: any) => parseFloat(val) > parseFloat(tokens[2]);
    case "<":
      return (val: any) => parseFloat(val) < parseFloat(tokens[2]);
    case "<=":
      return (val: any) => parseFloat(val) <= parseFloat(tokens[2]);
    case ">=":
      return (val: any) => parseFloat(val) >= parseFloat(tokens[2]);
    case "=":
      return (val: any) => parseFloat(val) === parseFloat(tokens[2]);
    case "!":
      return (val: any) => parseFloat(val) !== parseFloat(tokens[2]);
    default:
      return defaultCompare;
  }
}

export function numericFilter<T extends object>(
  rows: Array<Row<T>>,
  id: IdType<T>,
  filterValue: FilterValue
) {
  const comparator = parseValue(filterValue);
  return rows.filter((row) => comparator(row.values[id]));
}

numericFilter.autoRemove = (val: any) => !val;
