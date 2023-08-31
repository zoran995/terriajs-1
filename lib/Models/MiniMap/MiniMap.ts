import L, { LatLngBounds } from "leaflet";
import { autorun, computed, reaction, when, makeObservable } from "mobx";
import { RefObject } from "react";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import defined from "terriajs-cesium/Source/Core/defined";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import TerriaViewer from "../../ViewModels/TerriaViewer";
import Terria from "../Terria";
import ViewerMode from "../ViewerMode";
import MiniMapViewer from "./MiniMapViewer";
import ViewRectangle from "./ViewRectangle";
import isDefined from "../../Core/isDefined";
import MappableMixin from "../../ModelMixins/MappableMixin";

export default class MiniMap {
  private readonly terria: Terria;
  readonly miniViewer!: TerriaViewer;
  private disposeReactionCesium: () => void = () => {};
  private disposeReactionLeaflet: () => void = () => {};
  private _unsubscribeFromViewerEvents: () => void = () => {};
  private readonly rectangle!: ViewRectangle;

  constructor(terria: Terria, container: RefObject<HTMLDivElement>) {
    makeObservable(this);
    this.terria = terria;
    this.rectangle = new ViewRectangle(
      terria,
      rectToPolyline(
        this.terria.mainViewer.currentViewer.getCurrentCameraView().rectangle
      )
    );
    this.miniViewer = new MiniMapViewer(
      terria,
      computed(() => [this.rectangle])
    );
    this.miniViewer.viewerMode = ViewerMode.Leaflet;
    this.miniViewer.disableInteraction = true;
    this.setBaseMap();
    this.initialize();
    if (container.current) this.miniViewer.attach(container.current);

    autorun(() => {
      this.miniViewer.currentViewer.zoomTo(
        this.terria.mainViewer.currentViewer.getCurrentCameraView(),
        0
      );
    });
  }

  setBaseMap() {
    const baseMapItems = this.terria.baseMapsModel.baseMapItems;
    const initPreviewBaseMap = baseMapItems.find(
      (baseMap) =>
        baseMap.item?.uniqueId === this.terria.baseMapsModel.previewBaseMapId
    );

    if (
      isDefined(initPreviewBaseMap) &&
      MappableMixin.isMixedInto(initPreviewBaseMap.item)
    ) {
      this.miniViewer.setBaseMap(initPreviewBaseMap.item);
    } else {
      this.miniViewer.setBaseMap(
        baseMapItems.length > 0 ? baseMapItems[0].item : undefined
      );
    }
  }

  @computed
  private get cesiumViewer() {
    return this.terria.cesium;
  }

  @computed
  private get leafletViewer() {
    return this.terria.leaflet;
  }

  @computed
  private get isViewerCreated(): boolean {
    return defined(this.miniViewer);
  }

  @computed
  private get viewerCesium() {
    return this.isViewerCreated && this.cesiumViewer;
  }

  @computed
  private get viewerLeaflet() {
    return this.isViewerCreated && this.leafletViewer;
  }

  initialize() {
    //TODO: remove side effects where before and after viewer change gets implemented
    this.disposeReactionCesium = reaction(
      () => this.viewerCesium,
      () => this.subscribeToViewerEvents(),
      {
        equals: (a, b) => {
          return defined(b);
        }
      }
    );
    this.disposeReactionLeaflet = reaction(
      () => this.viewerLeaflet,
      () => this.subscribeToViewerEvents(),
      {
        equals: (a, b) => {
          return defined(b);
        }
      }
    );

    when(
      () => defined(this.viewerCesium),
      () => this.subscribeToViewerEvents()
    );
    when(
      () => defined(this.viewerLeaflet),
      () => this.subscribeToViewerEvents()
    );
  }

  destroy() {
    this.unsubscribeFromEvents();
    this.miniViewer.destroy();
  }

  private unsubscribeFromEvents() {
    this._unsubscribeFromViewerEvents && this._unsubscribeFromViewerEvents();
    this.disposeReactionCesium && this.disposeReactionCesium();
    this.disposeReactionLeaflet && this.disposeReactionLeaflet();
  }

  private subscribeToViewerEvents() {
    this.unsubscribeFromEvents();
    if (this.leafletViewer) {
      this.subscribeToLeafletEvents();
    } else if (this.cesiumViewer) {
      this.subscribeToCesiumEvents();
    }
  }

  private subscribeToLeafletEvents() {
    const map = this.terria.leaflet!.map;
    this.leafletEvent(map);
    const moveToCenter = () => this.leafletEvent(map);
    map.on("move", moveToCenter, this);
    this._unsubscribeFromViewerEvents = function () {
      map.off("move", moveToCenter, this);
    };
  }

  private subscribeToCesiumEvents() {
    this._unsubscribeFromViewerEvents =
      this.terria.cesium!.scene.postRender.addEventListener(() => {
        this.moveToCenterCesium(this.terria.cesium!.scene);
      });
  }

  private moveToCenterCesium(scene: Scene) {
    const cameraRect =
      this.terria.mainViewer.currentViewer.getCurrentCameraView().rectangle;
    if (cameraRect) {
      this.miniViewer.currentViewer.zoomTo(cameraRect, 0);
      this.rectangle.viewRectangle = rectToPolyline(cameraRect);
    }
  }

  private leafletEvent(map: L.Map) {
    const rectangle =
      this.terria.mainViewer.currentViewer.getCurrentCameraView().rectangle;
    this.miniViewer.currentViewer.zoomTo(rectangle, 0);
    this.rectangle.viewRectangle = rectToPolyline(rectangle);
  }
}

function rectToPolyline(rectangle: Rectangle): Cartesian3[] {
  const sw = Rectangle.southwest(rectangle);
  const se = Rectangle.southeast(rectangle);
  const nw = Rectangle.northwest(rectangle);
  const ne = Rectangle.northeast(rectangle);
  const polyline = [
    sw.longitude,
    sw.latitude,
    se.longitude,
    se.latitude,
    ne.longitude,
    ne.latitude,
    nw.longitude,
    nw.latitude,
    sw.longitude,
    sw.latitude
  ];
  return Cartesian3.fromRadiansArray(polyline);
}

function boundsToRectangle(mapBounds: LatLngBounds): Rectangle {
  return Rectangle.fromDegrees(
    mapBounds.getWest(),
    mapBounds.getSouth(),
    mapBounds.getEast(),
    mapBounds.getNorth()
  );
}
