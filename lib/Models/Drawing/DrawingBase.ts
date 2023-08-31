import i18next from "i18next";
import { computed, observable, reaction, runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import PolygonGraphics from "terriajs-cesium/Source/DataSources/PolygonGraphics";
import PolylineGlowMaterialProperty from "terriajs-cesium/Source/DataSources/PolylineGlowMaterialProperty";
import PolylineGraphics from "terriajs-cesium/Source/DataSources/PolylineGraphics";
import isDefined from "../../Core/isDefined";
import DragPoints from "../../Map/DragPoints/DragPoints";
import PickedFeatures from "../../Map/PickedFeatures/PickedFeatures";
import CatalogMemberMixin from "../../ModelMixins/CatalogMemberMixin";
import ExportableMixin from "../../ModelMixins/ExportableMixin";
import DrawingCatalogItemTraits from "../../Traits/TraitsClasses/DrawingCatalogItemTraits";
import CreateModel from "../Definition/CreateModel";
import { DrawTypeEnum } from "./DrawType";
import MapInteractionMode from "../MapInteractionMode";
import Terria from "../Terria";
import Result from "../../Core/Result";
import MappableMixin from "../../ModelMixins/MappableMixin";

const defaultOutlineColor = new Color(1.0, 1.0, 1.0, 1.0);
const defaultPolylineColor = new Color(1, 1, 1, 0.8);
const defaultFillColor = new Color(0.0, 0.666, 0.843, 0.25);
const defaultWidth = 5;
const defaultOutlineWidth = defaultWidth;

export interface DrawingBaseOptions {
  terria: Terria;
  messageHeader?: string;
  onMakeDialogMessage?: () => string;
  onPointClicked?: (dataSource: CustomDataSource) => void;
  onPointMoved?: (dataSource: CustomDataSource) => void;
  onCleanUp?: () => void;
  shouldRenderInteractionWindow?: boolean;
  shouldRemovePoint?: boolean;
}

export default abstract class DrawingBase extends ExportableMixin(
  MappableMixin(CatalogMemberMixin(CreateModel(DrawingCatalogItemTraits)))
) {
  private readonly messageHeader: string;
  private readonly onMakeDialogMessage?: () => string;
  private readonly onPointClicked?: (dataSource: CustomDataSource) => void;
  private readonly onPointMoved?: (dataSource: CustomDataSource) => void;
  protected readonly onCleanUp?: () => void;
  private readonly dragHelper: DragPoints;
  private readonly shouldRenderInteractionWindow: boolean;
  private readonly shouldRemovePoint: boolean;
  protected drawingMode: DrawTypeEnum;
  protected pickMode?: MapInteractionMode;
  @observable tooltipMessage: string;
  pointEntities: CustomDataSource;
  entities: CustomDataSource;
  entity?: Entity;
  @observable
  protected currentEntityId?: string;

  @observable
  private inDrawMode: boolean;
  protected pickDisposer?: () => void;

  constructor(options: DrawingBaseOptions) {
    super(createGuid(), options.terria);
    /**
     * Text that appears at the top of the dialog when drawmode is active.
     */
    this.messageHeader = defaultValue(
      options.messageHeader,
      i18next.t("models.userDrawing.messageHeader")
    );

    /**
     * The drawing mode.
     */
    this.drawingMode = DrawTypeEnum.POINT;

    /**
     * Callback that occurs when the dialog is redrawn, to add additional information to dialog.
     */
    this.onMakeDialogMessage = options.onMakeDialogMessage;

    /**
     * Callback that occurs when point is clicked (may be added or removed). Function takes a CustomDataSource which is
     * a list of PointEntities.
     */
    this.onPointClicked = options.onPointClicked;

    /**
     * Callback that occurs when point is moved. Function takes a CustomDataSource which is a list of PointEntities.
     */
    this.onPointMoved = options.onPointMoved;

    /**
     * Callback that occurs on clean up, i.e. when drawing is done or cancelled.
     */
    this.onCleanUp = options.onCleanUp;

    /**
     * Wheter default MapInteractionWindow should be rendered.
     */
    this.shouldRenderInteractionWindow = defaultValue(
      options.shouldRenderInteractionWindow,
      true
    );

    /**
     * Wheter the drawn point should be removed on user click
     */
    this.shouldRemovePoint = defaultValue(options.shouldRemovePoint, false);

    /**
     * Storage for points that will be drawn
     */
    this.pointEntities = new CustomDataSource("Points");

    /**
     * Storage for line that connects the points, and polygon if the first and last point are the same
     */
    this.entities = new CustomDataSource("Points, lines and polygons");

    /**
     * Whether to interpret user clicks as drawing
     */
    this.inDrawMode = false;

    // helper for dragging points around
    this.dragHelper = new DragPoints(options.terria, (customDataSource) => {
      if (this.onPointMoved) {
        this.onPointMoved(customDataSource);
      }
    });

    this.tooltipMessage = this.getTooltipMessage();
  }

  /**
   * Wheter the user is currently drawing something on the map.
   */
  get isDrawing() {
    return this.inDrawMode;
  }

  /**
   * Wheter the user is currently drawing something on the map.
   */
  @computed get currentDrawingMode(): DrawTypeEnum | undefined {
    return this.drawingMode;
  }

  get drawMode(): DrawTypeEnum | undefined {
    return this.drawingMode;
  }

  @computed get mapItems() {
    return [this.pointEntities, this.entities];
  }

  /**
   * @returns the id of entity user is currently drawing.
   */
  get getCurrentEntityId(): string | undefined {
    return this.currentEntityId;
  }

  /**
   * @returns the default point style
   */
  private get svgPoint() {
    /**
     * SVG element for point drawn when user clicks.
     * http://stackoverflow.com/questions/24869733/how-to-draw-custom-dynamic-billboards-in-cesium-js
     */
    var svgDataDeclare = "data:image/svg+xml,";
    var svgPrefix =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" xml:space="preserve">';
    var svgCircle =
      '<circle cx="10" cy="10" r="5" stroke="rgb(0,170,215)" stroke-width="4" fill="white" /> ';
    var svgSuffix = "</svg>";
    var svgString = svgPrefix + svgCircle + svgSuffix;

    // create the cesium entity
    return svgDataDeclare + svgString;
  }

  /**
   * Starts the drawing on the map. Updated the style of cursor to `crosshair`. Disable feature picking so there is no delay in while drawing on big datasets.
   *  Adds interaction mode to the MapInteractionModeStack with listener for the new point.
   * @param drawMode - current drawing mode
   */
  enterDrawMode(drawMode: DrawTypeEnum): void {
    this.dragHelper.setUp();
    if (this.inDrawMode) {
      return;
    }

    this.inDrawMode = true;
    this.drawingMode = drawMode;
    this.tooltipMessage = this.getTooltipMessage();
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
    this.drawHelper();
    addInteractionModeToMap(this.terria, this.pickMode);

    if (this.drawingMode === DrawTypeEnum.POLYGON) {
      this.startPolygonDraw();
    } else if (this.drawingMode === DrawTypeEnum.LINE) {
      this.startLineDraw();
    }

    this.pickDisposer = reaction(
      () => this.pickMode!.pickedFeatures,
      async (newPick: PickedFeatures | undefined, reaction) => {
        if (newPick === undefined) {
          return;
        }
        if (isDefined(newPick.allFeaturesAvailablePromise)) {
          await newPick.allFeaturesAvailablePromise;
        }
        if (isDefined(newPick.pickPosition)) {
          const pickedPoint = newPick.pickPosition;
          if (
            this.dragHelper.getDragCount() < 10 &&
            !this.clickedExistingPoint(newPick.features)
          ) {
            // No existing point was picked, so add a new point
            this.addTempPoint(pickedPoint);
          } else {
            this.dragHelper.resetDragCount();
          }
        }
      }
    );
  }

  /**
   * Starts the drawing of lines. Create a new entity which is using {@link CallbackProperty} for positions.
   */
  startLineDraw(): void {
    const that = this;
    const dynamicPositions = new CallbackProperty(function () {
      const points = that.getPointsForShape();
      return points;
    }, false);
    const entity = this.createPolylineEntity(dynamicPositions);
    this.currentEntityId = entity.id;
    this.entity = entity;
    this.entities.entities.add(entity);
  }

  /**
   * Starts the drawing of polygons on the map. Create a new entity which is using {@link CallbackProperty} for positions.
   */
  startPolygonDraw(): void {
    const that = this;
    const dynamicPositions = new CallbackProperty(function () {
      const points = new PolygonHierarchy(that.getPointsForShape());
      return points;
    }, false);
    const entity = this.createPolygonEntity(dynamicPositions);
    this.currentEntityId = entity.id;
    this.entity = entity;
    this.entities.entities.add(entity);
  }

  /**
   * Creates new interaction mode with a listener for a new point.
   */
  protected createMapInteractionMode(): MapInteractionMode {
    const pickPointMode = new MapInteractionMode({
      message: "",
      buttonText: this.getButtonText(),
      onCancel: (): void => {
        runInAction(() => {
          this.stopDrawing();
        });
      },
      render: this.shouldRenderInteractionWindow
    });
    return pickPointMode;
  }

  /**
   * Create new polyline Entity using default style.
   * @param positions - points constructing polyline.
   * @returns The polyline entity.
   */
  protected createPolylineEntity(positions: any[] | CallbackProperty) {
    const entity = new Entity({
      name: "polyline",
      polyline: new PolylineGraphics({
        positions: positions,
        material: new PolylineGlowMaterialProperty({
          color: new ConstantProperty(defaultPolylineColor),
          glowPower: new ConstantProperty(0.25)
        }),
        width: defaultWidth,
        clampToGround: true
      })
    });
    return entity;
  }

  /**
   * Create new polygon Entity using default style.
   * @param positions - points constructing polygon.
   * @returns The polygon entity.
   */
  protected createPolygonEntity(
    positions: PolygonHierarchy | CallbackProperty,
    polylinePositions?: any[] | CallbackProperty
  ) {
    const entity = new Entity({
      name: "polygon",
      polygon: new PolygonGraphics({
        hierarchy: positions,
        material: new ColorMaterialProperty(defaultFillColor),
        perPositionHeight: new ConstantProperty(true),
        outlineColor: defaultOutlineColor,
        outlineWidth: defaultOutlineWidth
      })
    });
    return entity;
  }

  /**
   * Add new point to temporary points list and update the tooltip message. If current drawing mode is point then adds point to entities.
   * @param position - point position
   */
  protected addTempPoint(position: Cartesian3): void {
    const point = this.createTempPoint(position);
    if (this.drawingMode === DrawTypeEnum.POINT) {
      this.entities.entities.add(point);
    }
    this.pointEntities.entities.add(point);
    this.dragHelper.updateDraggableObjects(this.pointEntities);
    if (isDefined(this.onPointClicked)) {
      this.onPointClicked(this.pointEntities);
    }
    this.tooltipMessage = this.getTooltipMessage();
  }

  /**
   * Creates new point entity using default style.
   * @param position - point position
   * @returns point entity
   */
  protected createTempPoint(position: Cartesian3): Entity {
    const pointEntity = new Entity({
      name: "point",
      position: position,
      billboard: <any>{
        image: this.svgPoint,
        eyeOffset: new Cartesian3(0.0, 0.0, -50.0)
      }
    });
    return pointEntity;
  }

  /**
   * Determines if user has clicked on existing point and performs appropriate action.
   * Default behaviour is to remove point unless the user is currently drawing points then point is removed if shouldRemovePoint is true.
   * @param features - list of entities detected on user click
   */
  protected clickedExistingPoint(features: Entity[]) {
    let userClickedExistingPoint = false;
    if (
      features.length < 1 ||
      (this.drawingMode === DrawTypeEnum.POINT && !this.shouldRemovePoint)
    ) {
      return userClickedExistingPoint;
    }

    const that = this;
    features.forEach((feature) => {
      let index = -1;
      for (let i = 0; i < this.pointEntities.entities.values.length; i++) {
        const pointFeature = this.pointEntities.entities.values[i];
        if (pointFeature.id === feature.id) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        return;
      } else {
        // User clicked existing point remove it
        this.pointEntities.entities.removeById(feature.id);
        if (this.drawingMode === DrawTypeEnum.POINT && this.shouldRemovePoint) {
          this.entities.entities.removeById(feature.id);
        }
        // Also let client of UserDrawing know if a point has been removed.
        if (typeof that.onPointClicked === "function") {
          that.onPointClicked(that.pointEntities);
        }
        userClickedExistingPoint = true;
        return;
      }
    });
    return userClickedExistingPoint;
  }

  /**
   * Stops the drawing. Returns the cursor to original state and allows the feature info requests.
   */
  stopDrawing(): void {
    if (this.pickDisposer) {
      this.pickDisposer();
    }
    if (this.pickMode) {
      removeInteractionModeFromMap(this.terria, this.pickMode);
    }
    this.terria.allowFeatureInfoRequests = true;
    this.pickMode = undefined;
    this.inDrawMode = false;
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
    // Allow client to clean up too
    if (typeof this.onCleanUp === "function") {
      this.onCleanUp();
    }
  }

  /**
   * Return a list of the coords for the user drawing.
   * @returns list of positions constructing the entity.
   */
  protected getPoints() {
    if (isDefined(this.pointEntities.entities)) {
      const pos = [];
      for (var i = 0; i < this.pointEntities.entities.values.length; i++) {
        const obj = this.pointEntities.entities.values[i];
        if (isDefined(obj.position)) {
          const position = obj.position.getValue(
            this.terria.timelineClock.currentTime
          );
          pos.push(position);
        }
      }
      return pos;
    }
  }

  /**
   * Return a list of the coords for the user drawing.
   * If user is drawing a polygon add the first point as last.
   * @returns list of coords constructing the entity.
   */
  protected getPointsForShape() {
    const pos = [];
    if (isDefined(this.pointEntities.entities)) {
      for (var i = 0; i < this.pointEntities.entities.values.length; i++) {
        const obj = this.pointEntities.entities.values[i];
        if (isDefined(obj.position)) {
          const position = obj.position.getValue(
            this.terria.timelineClock.currentTime
          );
          pos.push(position);
        }
      }
    }
    return pos;
  }

  /**
   * A function that will be triggered on specific event, for example right click finishes drawing and saves the element.
   */
  protected abstract drawHelper(): void;

  /**
   * Figure out the text for the dialog button.
   */
  getButtonText(): string {
    return this.pointEntities?.entities.values.length >= 2
      ? i18next.t("models.userDrawing.btnDone")
      : i18next.t("models.userDrawing.btnCancel");
  }

  /**
   * Create the HTML message for the dialog box.
   * @returns tooltip message
   */
  protected getTooltipMessage(): string {
    if (this.pointEntities.entities.values.length > 0) {
      return "translate#models.userDrawing.clickToAddAnotherPoint";
    } else {
      return "translate#models.userDrawing.clickToAddFirstPoint";
    }
  }

  protected forceLoadMapItems(): Promise<void> {
    return Promise.resolve();
  }

  protected _exportData(): Promise<
    string | { name: string; file: Blob } | undefined
  > {
    throw new Error("Method not implemented.");
  }

  protected get _canExportData(): boolean {
    return false;
  }
}
/**
 * Add new interaction mode to the MapInteractionModeStack.
 */
export function addInteractionModeToMap(
  terria: Terria,
  mode: MapInteractionMode
) {
  terria.mapInteractionModeStack.push(mode);
}

/**
 * Removes interaction mode to the MapInteractionModeStack.
 */
export function removeInteractionModeFromMap(
  terria: Terria,
  mode: MapInteractionMode
) {
  const [currentMode] = terria.mapInteractionModeStack.slice(-1);
  if (currentMode === mode) {
    terria.mapInteractionModeStack.pop();
  }
}
