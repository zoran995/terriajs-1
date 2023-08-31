import Color from "terriajs-cesium/Source/Core/Color";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import MappableMixin, { MapItem } from "../../ModelMixins/MappableMixin";
import MappableTraits from "./../../Traits/TraitsClasses/MappableTraits";
import CreateModel from "./../Definition/CreateModel";
import Terria from "./../Terria";

export default class ViewRectangle extends MappableMixin(
  CreateModel(MappableTraits)
) {
  private dataSource: CustomDataSource;
  viewRectangle?: any[];
  constructor(readonly terria: Terria, viewRectangle?: any[]) {
    super(undefined, terria);
    this.dataSource = new CustomDataSource();
    this.viewRectangle = viewRectangle;
    const entity = new Entity({
      polygon: new PolygonGraphics({
        hierarchy: new CallbackProperty(() => {
          return new PolygonHierarchy(this.viewRectangle);
        }, false),
        material: new Color(0.0, 0.2, 0.4, 0.5),
        outlineWidth: 2,
        outlineColor: new Color(0.0, 0.2, 0.4, 0.8)
      })
    });
    this.dataSource.entities.add(entity);
  }

  async forceLoadMapItems() {}

  get mapItems(): MapItem[] {
    return [this.dataSource];
  }
}
