import DataSource from "terriajs-cesium/Source/DataSources/DataSource";
import AbstractConstructor from "../Core/AbstractConstructor";
import isDefined from "../Core/isDefined";
import {
  AttributeTable,
  AttributeTableColumn,
  AttributeTableRowDataProps,
  AttributeTableRowInterface,
  createHeader
} from "../Models/AttributeTable";
import Model from "../Models/Definition/Model";
import Terria from "../Models/Terria";
import ModelTraits from "../Traits/ModelTraits";
import { FeatureCollectionWithCrs } from "./GeojsonMixin";
import { makeObservable } from "mobx";

export interface LooseObject {
  [key: string]: any;
}

type BaseType = Model<ModelTraits>;

function AttributeTableMixin<T extends AbstractConstructor<BaseType>>(Base: T) {
  abstract class AttributeTableMixin extends Base {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    get hasAttributeTableMixin() {
      return true;
    }

    abstract get attributeTable(): AttributeTable | undefined;

    abstract zoomToFeature(featureID: string): void;

    abstract selectWithId(featureID: string): void;

    protected createAttributeTable(
      dataSource: DataSource,
      terria: Terria
    ): AttributeTable {
      const data: AttributeTableRowInterface[] = [];

      const values = dataSource?.entities.values.filter((e) => !e.parent);
      const selectedFeature = terria.selectedFeature;
      if (values && values.length > 0) {
        const columnNames = values[0].properties?.propertyNames;
        if (!isDefined(columnNames)) {
          return new AttributeTable([], data, true);
        }
        const columns = this.createColumns(columnNames);

        for (let i = 0; i < values.length; i++) {
          const props = values[i].properties;
          if (!isDefined(props)) {
            continue;
          }
          const readyData: LooseObject = {};
          columns.forEach((column) => {
            readyData[column.accessor] = props[column.accessor].getValue();
          });
          const uniqueFeatureId = values[i].id;
          readyData.uniqueFeatureId = uniqueFeatureId;
          if (uniqueFeatureId === selectedFeature?.id) {
            readyData.isSelected = true;
          } else {
            readyData.isSelected = false;
          }
          data.push({
            uniqueFeatureId: uniqueFeatureId,
            values: <AttributeTableRowDataProps>readyData
          });
        }
        return new AttributeTable(columns, data, true);
      }
      return new AttributeTable([], data, true);
    }

    protected createAttributeTableFromFeatureCollection(
      featureCollection: FeatureCollectionWithCrs,
      terria: Terria
    ) {
      const data: AttributeTableRowInterface[] = [];
      const features = featureCollection?.features;
      if (features && features.length > 0 && !!features[0].properties) {
        const columnNames = Object.keys(features[0].properties);

        const columns = this.createColumns(columnNames);

        for (let i = 0; i < features.length; i++) {
          const props = features[i].properties;
          if (!isDefined(props)) {
            continue;
          }
          const readyData: LooseObject = {};
          columns.forEach((column) => {
            readyData[column.accessor] = props![column.accessor];
          });
          const uniqueFeatureId = features[i].id || props!["_id_"]!;
          readyData.uniqueFeatureId = uniqueFeatureId;
          if (uniqueFeatureId === terria.selectedFeature?.id) {
            readyData.isSelected = true;
          } else {
            readyData.isSelected = false;
          }
          data.push({
            uniqueFeatureId: uniqueFeatureId,
            values: <AttributeTableRowDataProps>readyData
          });
        }
        return new AttributeTable(columns, data, true);
      }
      return new AttributeTable([], data, true);
    }

    private createColumns(columnNames: string[]) {
      const columns: AttributeTableColumn[] = [];
      for (let i = 0; i < columnNames.length; i++) {
        const col = new AttributeTableColumn({
          Header: createHeader(columnNames[i]),
          accessor: columnNames[i]
        });
        columns.push(col);
      }
      return columns;
    }
  }

  return AttributeTableMixin;
}

namespace AttributeTableMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof AttributeTableMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model?.hasAttributeTableMixin;
  }
}

export default AttributeTableMixin;
