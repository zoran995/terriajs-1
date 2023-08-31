import TableColumnType from "../Table/TableColumnType";
import { JsonObject, JsonArray } from "../Core/Json";
import { UniqueColumnValues } from "../Table/TableColumn";
import { computed } from "mobx";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

export interface AttributeTableColumnProps {
  Header: string;
  accessor: string;
  type?: TableColumnType;
}

export interface AttributeTableRowDataProps {
  uniqueFeatureId?: string;
  isSelected?: boolean;
  [key: string]: any;
}

export interface AttributeTableRowInterface {
  uniqueFeatureId: string;
  values: AttributeTableRowDataProps;
}
export class AttributeTable {
  columns: AttributeTableColumn[];
  data: AttributeTableRowInterface[];
  canZoomToFeature: boolean;
  constructor(
    columns: AttributeTableColumn[],
    data: AttributeTableRowInterface[],
    canZoomToFeature?: boolean
  ) {
    this.columns = columns;
    this.data = data;
    this.canZoomToFeature = defaultValue(canZoomToFeature, false);
  }
}

export class AttributeTableColumn {
  Header: string;
  type: TableColumnType | undefined = undefined;
  accessor: string;
  constructor(props: AttributeTableColumnProps) {
    this.Header = props.Header;
    this.type = props.type ? props.type : TableColumnType.text;
    this.accessor = props.accessor;
  }
}

export function createHeader(name: string): string {
  return name.replace(/[^\w\s]|_/g, " ");
}
