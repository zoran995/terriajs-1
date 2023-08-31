import { LatLng } from "leaflet";
import { action, computed, observable, reaction, when } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Camera from "terriajs-cesium/Source/Scene/Camera";
import isDefined from "../Core/isDefined";
import Terria from "./Terria";

interface Options {
  terria: Terria;
}

interface View {
  zoomCenter?: ZoomCenter;
  cameraViewElement?: CameraViewElement;
}

interface ZoomCenter {
  zoom: number;
  centerPoint: LatLng;
}

interface CameraViewElement {
  destination: Cartesian3;
  orientation: CameraOrientation;
}

interface CameraOrientation {
  heading: number;
  pitch: number;
  roll: number;
  direction: Cartesian3;
  up: Cartesian3;
  right: Cartesian3;
}

export default class HistoryControls {
  static readonly DEFAULT_MOVES_TO_SAVE = 10;

  @observable private back: ZoomCenter[] | CameraViewElement[];
  @observable private forward: ZoomCenter[] | CameraViewElement[];
  private maxMovesToSave: number = HistoryControls.DEFAULT_MOVES_TO_SAVE;
  @observable ignoringEvents: boolean;
  private removeUpdateSubscription?: () => void;

  constructor(readonly terria: Terria) {
    /**
     * Gets or sets the stack of history views. Used for going back through views
     */
    this.back = [];

    /**
     * Gets or sets the stack of future views. Used for going forward through views
     */
    this.forward = [];

    /**
     * Gets or set shether we should store event. Used when user are moving through history.
     * @type {Boolean}
     * @default false
     */
    this.ignoringEvents = false;

    reaction(
      () => this.cesiumViewer,
      () => this.addUpdateSubscription(),
      {
        equals: (a, b) => {
          return isDefined(b);
        }
      }
    );

    reaction(
      () => this.leafletViewer,
      () => this.addUpdateSubscription(),
      {
        equals: (a, b) => {
          return isDefined(b);
        }
      }
    );

    when(
      () => isDefined(this.cesiumViewer),
      () => this.addUpdateSubscription()
    );
    when(
      () => isDefined(this.leafletViewer),
      () => this.addUpdateSubscription()
    );
  }

  @computed
  get cesiumViewer() {
    return this.terria.cesium;
  }

  @computed
  get leafletViewer() {
    return this.terria.leaflet;
  }

  @computed
  get backDisabled() {
    if (this.terria.cesium) {
      return this.back.length === 1;
    } else {
      return this.back.length === 0;
    }
  }

  @computed
  get forwardDisabled() {
    if (this.terria.cesium) {
      return this.forward.length === 1;
    } else {
      return this.forward.length === 0;
    }
  }

  @action.bound
  addUpdateSubscription() {
    this.clearBack();
    this.clearForward();
    if (this.removeUpdateSubscription) {
      this.removeUpdateSubscription();
    }
    if (this.terria.leaflet) {
      const potentialChangeCallback =
        this.potentialChangeCallbackLeaflet.bind(this);
      const map = this.terria.leaflet.map;
      map.on("movestart", potentialChangeCallback);
      this.removeUpdateSubscription = function () {
        map.off("movestart", potentialChangeCallback);
      };
    } else if (this.terria.cesium) {
      const potentialChangeCallback =
        this.potentialChangeCallbackCesium.bind(this);
      this.removeUpdateSubscription =
        this.terria.cesium.scene.camera.moveEnd.addEventListener(
          potentialChangeCallback
        );
    }
  }

  @action.bound
  private potentialChangeCallbackLeaflet(e: any) {
    if (!this.ignoringEvents) {
      const current = ZoomCenter(e.target);
      this.clearForward();
      this.push(this.back, current);
    } else {
      this.ignoringEvents = false;
    }
  }

  @action.bound
  private potentialChangeCallbackCesium(e: any) {
    var camera = this.terria.cesium!.scene.camera;
    if (!this.ignoringEvents) {
      const current = ViewElement(camera);
      this.clearForward();
      this.push(this.back, current);
      this.push(this.forward, current);
    } else {
      this.ignoringEvents = false;
    }
  }

  /**
   * Clear history of map views.
   */
  @action.bound
  private clearBack() {
    this.back = [];
  }

  /**
   * Clear forward of map views.
   */
  @action.bound
  private clearForward() {
    this.forward = [];
  }

  private push(stack: ZoomCenter[] | CameraViewElement[], value: any): void {
    stack.push(value);
    if (this.maxMovesToSave > 0 && stack.length > this.maxMovesToSave) {
      stack.shift();
    }
  }

  moveWithOutTriggeringEvent(view: View) {
    this.ignoringEvents = true;
    if (this.terria.leaflet && view.zoomCenter) {
      var map = this.terria.leaflet.map;
      map.setView(view.zoomCenter.centerPoint, view.zoomCenter.zoom);
    } else if (this.terria.cesium && view.cameraViewElement) {
      this.ignoringEvents = true;
      this.terria.cesium.scene.camera.flyTo({
        destination: view.cameraViewElement.destination,
        orientation: view.cameraViewElement.orientation
      });
    }
  }

  goBack() {
    let previousZoomCenter;
    let previousViewElement;
    if (this.terria.leaflet) {
      const map = this.terria.leaflet.map;
      const current = ZoomCenter(map);
      previousZoomCenter = <ZoomCenter>this.back.pop();
      this.push(this.forward, current);
    } else if (this.terria.cesium) {
      const current = this.back.pop();
      previousViewElement = <CameraViewElement>this.back.pop();

      this.push(this.forward, previousViewElement);
      this.push(this.back, previousViewElement);
    }
    this.moveWithOutTriggeringEvent({
      zoomCenter: previousZoomCenter,
      cameraViewElement: previousViewElement
    });
  }

  goForward() {
    let previousZoomCenter;
    let previousViewElement;
    if (this.terria.leaflet) {
      const map = this.terria.leaflet.map;
      const current = ZoomCenter(map);
      previousZoomCenter = <ZoomCenter>this.forward.pop();
      this.push(this.back, current);
    } else if (this.terria.cesium) {
      const current = this.forward.pop();
      previousViewElement = <CameraViewElement>this.forward.pop();

      this.push(this.back, previousViewElement);
      this.push(this.forward, previousViewElement);
    }
    this.moveWithOutTriggeringEvent({
      zoomCenter: previousZoomCenter,
      cameraViewElement: previousViewElement
    });
  }
}

const ViewElement = function (camera: Camera): CameraViewElement {
  return {
    destination: camera.positionWC.clone(),
    orientation: {
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
      direction: camera.direction.clone(),
      up: camera.up.clone(),
      right: camera.right.clone()
    }
  };
};

const ZoomCenter = function (map: L.Map): ZoomCenter {
  const zoom = map.getZoom();
  const center = map.getCenter();

  return {
    zoom: zoom,
    centerPoint: center
  };
};
