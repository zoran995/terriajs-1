import { computed, observable, makeObservable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import ModelTraits from "../Traits/ModelTraits";
import CreateModel from "./Definition/CreateModel";
import { MarkerDetails } from "./LocationMarkerUtils";
import Terria from "./Terria";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
import zoomRectangleFromPoint from "../Map/Vector/zoomRectangleFromPoint";
import LatLonHeight from "./../Core/LatLonHeight";
import MappableMixin from "../ModelMixins/MappableMixin";
import MappableTraits from "../Traits/TraitsClasses/MappableTraits";

const markerIcon = require("../../wwwroot/images/difference-pin.png");
interface Options {
  terria: Terria;
}

export default class CoordinateSearchUtils extends MappableMixin(
  CreateModel(MappableTraits)
) {
  private pointEntities: CustomDataSource;

  constructor(options: Options) {
    super(createGuid(), options.terria);
    makeObservable(this);
    this.pointEntities = new CustomDataSource("search point");
  }

  startSearch() {
    this.terria.overlays.add(this);
  }

  cleanUp() {
    this.pointEntities.entities.removeAll();
    this.terria.overlays.remove(this);
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  @computed get mapItems() {
    return [this.pointEntities];
  }

  addMarker(details: MarkerDetails) {
    const location = details.location;

    const billboard: any = {
      image: details.customMarkerIcon || markerIcon,
      scale: details.customMarkerIcon ? 1 : 1,
      verticalOrigin: VerticalOrigin.BOTTOM,
      heightReference:
        details.heightReference ||
        (details.location.height === undefined ? "CLAMP_TO_GROUND" : "NONE")
    };
    const entity = new Entity({
      name: details.name,
      position: new ConstantPositionProperty(
        Cartesian3.fromDegrees(
          location.longitude,
          location.latitude,
          location.height
        )
      ),
      billboard: billboard
    });

    this.pointEntities.entities.removeAll();
    this.pointEntities.entities.add(entity);
    this.terria.currentViewer.notifyRepaintRequired();
  }

  removeMarker() {
    this.pointEntities.entities.removeAll();
  }

  jumpToPoint(location: LatLonHeight) {
    var bboxSize = 0.2;
    var rectangle = zoomRectangleFromPoint(
      location.latitude,
      location.longitude,
      bboxSize
    );
    this.terria.currentViewer.zoomTo(rectangle, 1);
  }
}
