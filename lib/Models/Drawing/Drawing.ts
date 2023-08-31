import i18next from "i18next";
import {
  action,
  computed,
  makeObservable,
  observable,
  override,
  reaction,
  runInAction
} from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import NearFarScalar from "terriajs-cesium/Source/Core/NearFarScalar";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import LabelGraphics from "terriajs-cesium/Source/DataSources/LabelGraphics";
import PointGraphics from "terriajs-cesium/Source/DataSources/PointGraphics";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import exportKml from "terriajs-cesium/Source/DataSources/exportKml";
import HorizontalOrigin from "terriajs-cesium/Source/Scene/HorizontalOrigin";
import LabelStyle from "terriajs-cesium/Source/Scene/LabelStyle";
import VerticalOrigin from "terriajs-cesium/Source/Scene/VerticalOrigin";
import entityCollectionToGeoJsonAndPrintStyle from "../../Core/entityCollectionToGeoJsonAndPrintStyle";
import isDefined from "../../Core/isDefined";
import PickedFeatures from "../../Map/PickedFeatures/PickedFeatures";
import prettifyCoordinates from "../../Map/Vector/prettifyCoordinates";
import { describeWithoutUnderscores } from "../../ModelMixins/GeojsonMixin";
import addUserCatalogMember from "../Catalog/addUserCatalogMember";
import CommonStrata from "../Definition/CommonStrata";
import { GeojsonPrintLayer } from "../printLayers";
import { DrawTypeEnum } from "./DrawType";
import DrawingBase, {
  DrawingBaseOptions,
  addInteractionModeToMap,
  removeInteractionModeFromMap
} from "./DrawingBase";
import {
  ColorInterface,
  FontType,
  lineStyles,
  pointStyles,
  polygonStyles,
  textStyles
} from "./DrawingUtils";
import Terria from "../Terria";

const toGeoJSON = require("@mapbox/togeojson");

interface PointStyle {
  color: ColorInterface;
  opacity: number;
  size: number;
}

interface LineStyle {
  color: ColorInterface;
  opacity: number;
  width: number;
}

interface PolygonStyle {
  fillColor: ColorInterface;
  opacity: number;
  outlineColor: ColorInterface;
  outlineWidth: number;
}

interface TextStyle {
  font: FontType;
  size: number;
  text: string;
  color: ColorInterface;
}

/**
 * Extends the {@link DrawingBase} class with possibility to define custom style for elements.
 *
 * @constructor
 */
export default class Drawing extends DrawingBase {
  private readonly defaultPointStyle: PointStyle;
  private readonly defaultLineStyle: LineStyle;
  private readonly defaultPolygonStyle: PolygonStyle;
  @observable pointStyle: PointStyle;
  @observable lineStyle: LineStyle;
  @observable polygonStyle: PolygonStyle;
  @observable textStyle: TextStyle;
  private floatingPoint?: Cartesian3;
  @observable
  private inDeleteMoode: boolean;
  @observable
  private enableDelete: boolean = false;

  private static _drawing?: Drawing;

  static getInstance(terria: Terria): Drawing {
    if (!this._drawing) {
      this._drawing = new Drawing({
        terria,
        shouldRenderInteractionWindow: false,
        shouldRemovePoint: true
      });
    }
    return this._drawing;
  }

  private constructor(options: DrawingBaseOptions) {
    super(options);

    makeObservable(this);

    this.pointStyle = {
      color: pointStyles.colorList[0],
      opacity: 1,
      size: pointStyles.pointSizes[0]
    };

    this.lineStyle = {
      color: lineStyles.colorList[0],
      opacity: 0.8,
      width: lineStyles.lineWidths[2]
    };

    this.polygonStyle = {
      fillColor: polygonStyles.fillColorList[0],
      outlineColor: polygonStyles.outlineColorList[0],
      opacity: 0.25,
      outlineWidth: polygonStyles.outlineWidths[2]
    };

    this.textStyle = {
      font: textStyles.fonts[0],
      size: textStyles.sizes[0],
      text: "",
      color: textStyles.colorList[0]
    };

    /**
     * Whether to delete drawn elements on user click
     */
    this.inDeleteMoode = false;

    this.defaultPointStyle = this.pointStyle;
    this.defaultLineStyle = this.lineStyle;
    this.defaultPolygonStyle = this.polygonStyle;
  }

  /**
   * Wheter the user is currently deleting drawn elements.
   */
  get isDeleting(): boolean {
    return this.inDeleteMoode;
  }

  @computed
  get _canExportData() {
    return true;
  }

  async _exportData() {
    return this.exportKmlData();
  }

  async exportKmlData() {
    return exportKml({
      entities: this.entities.entities
    }).then((result: any) => {
      const kmlObj = result.kml;
      return {
        name: (this.name || this.uniqueId)! + ".kml",
        file: new Blob([kmlObj])
      };
    });
  }

  async exportGeoJsonData() {
    return exportKml({
      entities: this.entities.entities
    }).then((result: any) => {
      const kmlObj = result.kml;
      const doc = new DOMParser().parseFromString(kmlObj, "text/xml");
      const geoJsonObj = toGeoJSON.kml(doc);
      return {
        name: (this.name || this.uniqueId)! + ".json",
        file: new Blob([JSON.stringify(geoJsonObj)])
      };
    });
  }

  /**
   * Wheter the delete button is enabled.
   */
  @computed
  get isDeleteEnabled(): boolean {
    return this.enableDelete;
  }

  /**
   * Changes the status of delete button (enable/disable).
   */
  @action
  toggleDeleteButton() {
    if (this.entities.entities.values.length > 0) {
      this.enableDelete = true;
    } else {
      this.enableDelete = false;
      this.stopDeleting();
    }
  }

  /**
   * Starts the drawing on the map.
   *
   * @override
   * @param drawMode - currently selected drawing mode
   */
  enterDrawMode(drawMode: DrawTypeEnum): void {
    // this.terria.overlays.add(this);
    this.clearCurrentDrawingEntity();
    const name = i18next.t("models.drawingCatalogItem.layerName");
    this.setTrait(CommonStrata.user, "name", name);
    this.terria.workbench.add(this);
    addUserCatalogMember(this.terria, this);
    if (this.uniqueId && !this.terria.getModelById(Drawing, this.uniqueId)) {
      this.terria.addModel(this);
    }
    if (this.isDeleting) {
      this.stopDeleting();
    }
    super.enterDrawMode(drawMode);
  }

  /**
   * {@inheritdoc DrawingBase.drawHelper}
   *
   * Sets the mouse move listener for 2D and 3D viewer so the effect of floating pointing is active.
   * Sets the listener for mouse right click.
   */
  protected drawHelper() {
    const onRightClick = this.onRightClick;
    if (this.terria.leaflet) {
      this.terria.leaflet.map.on("mousemove", this.leafletMoveListener, this);
      this.terria.leaflet.map.on("contextmenu", onRightClick, this);
    } else if (this.terria.cesium) {
      const handler = new ScreenSpaceEventHandler(
        this.terria.cesium.scene.canvas
      );
      this.cesiumMoveListener();
      handler.setInputAction(function (e) {
        onRightClick(e);
      }, ScreenSpaceEventType.RIGHT_CLICK);
    }
  }

  /**
   * Used for creating moving effect of floating point when viewer is in 3D.
   */
  @action.bound
  private cesiumMoveListener() {
    const scene = this.terria.cesium!.scene;
    const handler = new ScreenSpaceEventHandler(scene.canvas);
    const that = this;

    handler.setInputAction(function (movement) {
      var pickRay = scene.camera.getPickRay(movement.endPosition);
      if (pickRay) {
        var cartesian = scene.globe.pick(pickRay, scene);
        if (cartesian) {
          that.floatingPoint = cartesian;
        }
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);
  }

  /**
   * Used for creating moving effect of floating point when viewer is in 2D.
   *
   * @param movement
   */
  @action.bound
  private leafletMoveListener(movement: any) {
    var cartesian = Cartesian3.fromDegrees(
      movement.latlng.lng,
      movement.latlng.lat
    );
    if (cartesian) {
      this.floatingPoint = cartesian;
    }
  }

  /**
   * Stops the drawing. Removes the temporary points, and if user was drawing line or polygon removes it.
   */
  stopDrawing() {
    this.floatingPoint = undefined;
    this.pointEntities.entities.removeAll();
    this.clearCurrentDrawingEntity();
    super.stopDrawing();
  }

  /**
   * Removes current drawing entity.
   */
  clearCurrentDrawingEntity() {
    if (this.getCurrentEntityId) {
      this.entities.entities.removeById(this.getCurrentEntityId);
      this.currentEntityId = undefined;
    }
  }

  /**
   * Removes floating point and saves the entity.
   *
   * @param e
   */
  @action.bound
  onRightClick(e: any) {
    if (e.originalEvent && e.originalEvent.preventDefault) {
      e.originalEvent.preventDefault();
    }
    this.floatingPoint = undefined;
    this.saveEntity();
    this.tooltipMessage = this.getTooltipMessage();
  }

  /**
   * Save the entity with final ammount of points, and remove temporary points created while drawing element.
   */
  saveEntity() {
    if (
      this.currentDrawingMode === DrawTypeEnum.LINE &&
      this.pointEntities.entities.values.length > 1
    ) {
      const entity = this.createPolylineEntity(this.getPointsForShape()!);
      this.clearCurrentDrawingEntity();
      this.entities.entities.add(entity);
      this.startLineDraw();
    } else if (
      this.currentDrawingMode === DrawTypeEnum.POLYGON &&
      this.pointEntities.entities.values.length > 2
    ) {
      const points = this.getPointsForShape()!;
      const entity = this.createPolygonEntity(
        new PolygonHierarchy(points),
        points
      );
      this.clearCurrentDrawingEntity();
      this.entities.entities.add(entity);
      this.startPolygonDraw();
    }
    this.toggleDeleteButton();

    this.pointEntities.entities.removeAll();
  }

  /**
   * Adds the polyline positions for polygon entity.
   * {@inheritdoc DrawingBase.addTempPoint}
   * @override
   */
  startPolygonDraw(): void {
    const that = this;
    const dynamicPositions = new CallbackProperty(function () {
      const points = new PolygonHierarchy(that.getPointsForShape());
      return points;
    }, false);
    const dynamicPolylinePositions = new CallbackProperty(function () {
      const points = that.getPointsForShape();
      return points;
    }, false);
    const entity = this.createPolygonEntity(
      dynamicPositions,
      dynamicPolylinePositions
    );
    this.currentEntityId = entity.id;
    this.entity = entity;
    this.entities.entities.add(entity);
  }

  /**
   *
   * {@inheritdoc DrawingBase.addTempPoint}
   * @override
   *
   * @param position
   */
  @action
  protected addTempPoint(position: Cartesian3) {
    if (this.drawingMode === DrawTypeEnum.LABEL) {
      const label = this.createLabel(position);
      this.entities.entities.add(label);
    } else {
      super.addTempPoint(position);
    }
    this.toggleDeleteButton();
  }

  /**
   * Function used for adding textual elements on the map. Creates new entity with label element on desired position.
   *
   * @param position
   */
  private createLabel(position: Cartesian3): Entity {
    const style = this.textStyle;
    let labelEntity = new Entity({
      name: "label",
      position: position,
      point: new PointGraphics({
        color: style.color.value.withAlpha(0),
        outlineColor: style.color.value.withAlpha(0)
      }),
      label: new LabelGraphics({
        text: new ConstantProperty(style.text),
        font: `${style.size}px ${style.font.cssName}`,
        fillColor: style.color.value,
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.CENTER),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        style: new ConstantProperty(LabelStyle.FILL),
        scaleByDistance: new ConstantProperty(
          new NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
        )
      })
    });

    labelEntity.properties = new PropertyBag();
    labelEntity.properties.addProperty("title", style.text);
    labelEntity.properties.addProperty("name", style.text);

    return labelEntity;
  }

  /**
   * Override {@link DrawingBase#createPolylineEntity`} function with user selected and style and add properties.
   *
   * {@inheritdoc DrawingBase.createPolylineEntity}
   * @override
   * @param positions
   */
  protected createPolylineEntity(positions: any[] | CallbackProperty) {
    this.pointStyle = this.defaultPointStyle;
    const style = this.lineStyle;
    const color = style.color;
    const entity = new Entity({
      name: "polyline",
      polyline: new PolylineGraphics({
        positions: positions,
        material: new ColorMaterialProperty(
          color.value.withAlpha(style.opacity)
        ),
        width: style.width,
        clampToGround: true
      })
    });

    entity.properties = new PropertyBag();
    entity.properties.addProperty("title", entity.name);
    entity.properties.addProperty("name", entity.name);

    entity.description = new ConstantProperty(
      describeWithoutUnderscores(
        entity.properties.getValue(this.terria.timelineClock.currentTime)
      )
    );

    return entity;
  }

  /**
   * Override {@link DrawingBase#createPolygonEntity`} function with user selected and style and add properties.
   *
   * {@inheritdoc DrawingBase.createPolygonEntity}
   * @override
   * @param positions
   */
  protected createPolygonEntity(
    positions: PolygonHierarchy | CallbackProperty,
    polylinePositions?: any[] | CallbackProperty
  ) {
    this.pointStyle = this.defaultPointStyle;
    const style = this.polygonStyle;
    const fillColor = style.fillColor;
    const outlineColor = style.outlineColor;
    const entity = new Entity({
      name: "polygon",
      polygon: new PolygonGraphics({
        hierarchy: positions,
        material: new ColorMaterialProperty(
          fillColor.value.withAlpha(style.opacity)
        ),
        perPositionHeight: new ConstantProperty(true),
        outlineColor: outlineColor.value.withAlpha(style.opacity),
        outlineWidth: style.outlineWidth
      })
    });

    if (isDefined(polylinePositions)) {
      entity.polyline = new PolylineGraphics({
        positions: polylinePositions,
        material: new ColorMaterialProperty(
          outlineColor.value.withAlpha(style.opacity)
        ),
        width: style.outlineWidth,
        clampToGround: true
      });
    }

    entity.properties = new PropertyBag();
    entity.properties.addProperty("title", entity.name);
    entity.properties.addProperty("name", entity.name);

    entity.description = new ConstantProperty(
      describeWithoutUnderscores(
        entity.properties.getValue(this.terria.timelineClock.currentTime)
      )
    );

    return entity;
  }

  /**
   * Override {@link DrawingBase#createTempPoint`} function with user selected and style and add properties.
   *
   * {@inheritdoc DrawingBase.createTempPoint}
   * @override
   *
   * @param position
   */
  protected createTempPoint(position: Cartesian3): Entity {
    let pointEntity;
    const style = this.pointStyle;
    if (style) {
      const color = style.color;
      pointEntity = new Entity({
        name: "point",
        position: position,
        point: new PointGraphics({
          color: color.value.withAlpha(style.opacity),
          pixelSize: style.size
        })
      });
    } else {
      pointEntity = super.createTempPoint(position);
    }

    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latLng = prettifyCoordinates(longitude, latitude);

    pointEntity.properties = new PropertyBag();
    pointEntity.properties.addProperty("title", pointEntity.name);
    pointEntity.properties.addProperty("name", pointEntity.name);
    pointEntity.properties.addProperty("latitude", latLng.latitude);
    pointEntity.properties.addProperty("longitude", latLng.longitude);
    pointEntity.description = new ConstantProperty(
      describeWithoutUnderscores(
        pointEntity.properties.getValue(this.terria.timelineClock.currentTime)
      )
    );

    return pointEntity;
  }

  protected getTooltipMessage(): string {
    if (this.drawingMode === DrawTypeEnum.POINT) {
      return "translate#models.drawingCatalogItem.clickToDrawPoint";
    } else if (this.drawingMode === DrawTypeEnum.LABEL) {
      return "translate#models.drawingCatalogItem.clickToDrawLabel";
    } else if (this.drawingMode === DrawTypeEnum.LINE) {
      if (this.pointEntities.entities.values.length === 0) {
        return "translate#models.drawingCatalogItem.clickTostartDrawingLine";
      } else if (this.pointEntities.entities.values.length === 1) {
        return "translate#models.drawingCatalogItem.lineOnePoint";
      } else {
        return "translate#models.drawingCatalogItem.keepDrawingLine";
      }
    } else if (this.drawingMode === DrawTypeEnum.POLYGON) {
      if (this.pointEntities.entities.values.length === 0) {
        return "translate#models.drawingCatalogItem.clickTostartDrawingPolygon";
      } else if (
        this.pointEntities.entities.values.length === 1 ||
        this.pointEntities.entities.values.length === 2
      ) {
        return "translate#models.drawingCatalogItem.polygonOnePoint";
      } else {
        return "translate#models.drawingCatalogItem.keepDrawingPolygon";
      }
    } else {
      return "";
    }
  }

  startDeleteElement() {
    if (this.isDrawing) {
      this.stopDrawing();
    }
    this.inDeleteMoode = true;
    if (isDefined(this.terria.cesium)) {
      this.terria.cesium.cesiumWidget.canvas.setAttribute(
        "style",
        "cursor: crosshair"
      );
    } else if (isDefined(this.terria.leaflet)) {
      const container = document.getElementById("cesiumContainer");
      if (container !== null) {
        container.setAttribute("style", "cursor: crosshair");
      }
    }
    // Cancel any feature picking already in progress and disable feature info requests.
    runInAction(() => {
      this.terria.pickedFeatures = undefined;
      this.terria.allowFeatureInfoRequests = false;
    });
    this.pickMode = this.createMapInteractionMode();
    addInteractionModeToMap(this.terria, this.pickMode);
    this.pickDisposer = reaction(
      () => this.pickMode!.pickedFeatures,
      async (newPick: PickedFeatures | undefined, reaction) => {
        if (newPick === undefined) {
          return;
        }
        if (isDefined(newPick.allFeaturesAvailablePromise)) {
          await newPick.allFeaturesAvailablePromise;
        }
        this.deleteElement(newPick.features);
      }
    );
  }

  /**
   * Determines if user has clicked on existing drawn element and removes it.
   * @param features  - list of entities detected on user click
   */
  private deleteElement(features: Entity[]) {
    let userClickedExistingElement = false;
    if (features.length < 1) {
      return userClickedExistingElement;
    }
    const that = this;
    features.forEach((feature) => {
      let index = -1;
      for (let i = 0; i < this.entities.entities.values.length; i++) {
        const entity = this.entities.entities.values[i];
        if (entity.id === feature.id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        return;
      } else {
        // User clicked existing entity remove it
        this.entities.entities.removeById(feature.id);
        userClickedExistingElement = true;
        return;
      }
    });
    this.toggleDeleteButton();
    return userClickedExistingElement;
  }

  stopDeleting() {
    if (this.pickDisposer) {
      this.pickDisposer();
    }
    if (this.pickMode) {
      removeInteractionModeFromMap(this.terria, this.pickMode);
    }
    this.terria.allowFeatureInfoRequests = true;
    this.pickMode = undefined;
    this.inDeleteMoode = false;
    // Return cursor to original state
    if (isDefined(this.terria.cesium)) {
      this.terria.cesium.cesiumWidget.canvas.setAttribute(
        "style",
        "cursor: auto"
      );
    } else if (isDefined(this.terria.leaflet)) {
      const container = document.getElementById("cesiumContainer");
      if (container !== null) {
        container.setAttribute("style", "cursor: auto");
      }
    }
  }

  encodeLayerForPrint(): GeojsonPrintLayer | undefined {
    if (this.entities.entities && this.entities.entities.values.length > 0) {
      const geojsonAndStyle = entityCollectionToGeoJsonAndPrintStyle(
        this.terria,
        this.entities.entities,
        true
      );
      return {
        type: "geojson",
        geoJson: geojsonAndStyle.geojson,
        style: geojsonAndStyle.style
      };
    }
  }

  /**
   * Override {@link DrawingBase#getPointsForShape`} function with added floating point for effect of dynamic drawing.
   *
   * {@inheritdoc DrawingBase.getPointsForShape}
   * @override
   */
  protected getPointsForShape() {
    const pos = super.getPointsForShape();
    if (pos) {
      if (this.floatingPoint) {
        pos.push(this.floatingPoint);
      }
    }
    if (this.drawMode === DrawTypeEnum.POLYGON && pos && pos.length > 1) {
      pos.push(pos[0]);
    }
    return pos;
  }

  /**
   * This is called when data is removed from workbench. Removes the model from data catalog, stops drawing, and removes all entities.
   */
  @action.bound
  onRemoveFromWorkbench() {
    this.terria.removeModelReferences(this);
    this.stopDrawing();
    this.stopDeleting();
    this.entities.entities.removeAll();
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }

  @override
  get mapItems() {
    if (this.entities) {
      this.entities.show = this.show;
      return [this.entities, this.pointEntities];
    }
    return [];
  }

  static readonly type = "user-draw-data";

  get type() {
    return Drawing.type;
  }

  get typeName() {
    return i18next.t("models.drawingCatalogItem.name");
  }

  @override
  get disableZoomTo() {
    return false;
  }

  @override
  get disableAboutData() {
    return false;
  }

  @computed
  get hasLocalData() {
    return true;
  }

  @override
  get description() {
    return i18next.t("models.drawingCatalogItem.description");
  }
}
