import i18next, { TFunction } from "i18next";
import { Point } from "leaflet";
import { action, observable, runInAction, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { DefaultTheme, withTheme } from "styled-components";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import isDefined from "../../../Core/isDefined";
import loadWithXhr from "../../../Core/loadWithXhr";
import TerriaError from "../../../Core/TerriaError";
import { applyTranslationIfExists } from "../../../Language/languageHelpers";
import Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";
import Input from "../../../Styled/Input";
import { parseCustomMarkdownToReactWithOptions } from "../../Custom/parseCustomMarkdownToReact";
import { GLYPHS } from "../../../Styled/Icon";
import WarningBox from "../../Preview/WarningBox";
import ToolPanel, { MainPanel, Selector } from "../ToolPanel";
import { JsonObject } from "./../../../Core/Json";
import loadJson from "./../../../Core/loadJson";
import PrintCapabilities, {
  PrintLayout,
  PrintMapSize
} from "./PrintCapabilities";

const Box: any = require("../../../Styled/Box").default;
const Button: any = require("../../../Styled/Button").default;
const Text: any = require("../../../Styled/Text").default;
const Spacing: any = require("../../../Styled/Spacing").default;

interface PropsType extends WithTranslation {
  viewState: ViewState;
  theme: DefaultTheme;
}

interface BBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface Size {
  x: number;
  y: number;
}

interface PrintReportResponse {
  downloadUrl: string;
  ref: string;
  statusUrl: string;
}
interface PrintStatusResponse {
  done: boolean;
  status: "waiting" | "running" | "finished" | "cancelled" | "error";
  error: string;
}

const DOTS_PER_INCH = 72;
const INCHES_PER_METER = 39.37;

@observer
class PrintToolPanel extends React.Component<PropsType> {
  static displayName = "PrintToolPanel";
  static readonly toolName = "Print map";
  private terria: Terria;
  printMaskCanvas: HTMLCanvasElement;
  private removeListeners?(): void;
  private updateMask?(): any;
  private printContext: CanvasRenderingContext2D | null;
  private printReportRef?: string;
  private statusTimeoutPromise: any;

  @observable layouts?: PrintLayout[];
  @observable currentLayout?: PrintLayout;
  @observable currentScale?: number;
  @observable title: string = "Karta";
  @observable dpiForPdf: number = 96;
  @observable isScaleSelectedManually: boolean = false;
  @observable pageBounds?: BBox;
  @observable initalisationError: boolean = false;
  @observable isPrinting: boolean;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
    this.printMaskCanvas = document.createElement("canvas");
    this.printMaskCanvas.style.position = "absolute";
    this.printMaskCanvas.style.zIndex = "1000";
    this.printMaskCanvas.style.pointerEvents = "none;";
    this.printContext = this.printMaskCanvas.getContext("2d");
    this.terria = props.viewState.terria;
    this.isPrinting = false;

    const url = this.printServerUrl;
    if (!url) {
      this.initalisationError = true;
    } else {
      PrintCapabilities.fromUrl(url)
        .then((printCapabilities) => {
          runInAction(() => {
            this.layouts = printCapabilities.layouts;
            this.currentLayout = this.layouts[0];
            this.currentScale = this.currentLayout?.scaleList[0];
          });
        })
        .then(() => {
          if (this.currentLayout && this.currentScale) {
            this.printMask();
          }
        })
        .catch((e) => {
          runInAction(() => {
            this.initalisationError = true;
          });
        });
    }
  }

  @action.bound
  updateTitle(e: React.ChangeEvent<HTMLInputElement>): void {
    const value = e.target.value;
    if (value.length < 25) this.title = value;
  }

  @action.bound
  changeLayout(e: React.ChangeEvent<HTMLSelectElement>): void {
    const layout: PrintLayout | undefined = this.layouts?.find(
      (layout) => layout.name.toString() === e.target.value
    );
    if (layout) {
      this.currentLayout = layout;
      this.setCurrentScale(layout.scaleList[0]);
      if (this.updateMask) {
        this.updateMask();
      }
    }
  }

  @action.bound
  changeScale(e: React.ChangeEvent<HTMLSelectElement>): void {
    const scale: number | undefined = this.currentLayout?.scaleList.find(
      (scale) => scale.toString() === e.target.value
    );
    if (scale) {
      this.setCurrentScale(scale, true);
      if (this.updateMask) {
        this.updateMask();
      }
    }
  }

  componentWillUnmount() {
    this.destroyPrintMask();
  }

  render() {
    const { viewState, t } = this.props;
    return (
      <Text large>
        <ToolPanel
          viewState={viewState}
          toolTitle={t("printTool.title")}
          exitTitle={t("printTool.exit")}
          glyph={GLYPHS.printer}
          exitAction={() => {
            this.destroyPrintMask();
          }}
        >
          {this.initalisationError ? (
            <MainPanel
              isMapFullScreen={viewState.isMapFullScreen}
              styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
            >
              <WarningBox>{t("printTool.urlUndefined")}</WarningBox>
            </MainPanel>
          ) : (
            <MainPanel
              isMapFullScreen={viewState.isMapFullScreen}
              styledMaxHeight={`calc(100vh - ${viewState.bottomDockHeight}px - 150px)`}
            >
              <Box fullWidth column>
                <Text textLight css={"p {margin: 0;}"}>
                  {parseCustomMarkdownToReactWithOptions(
                    `${t("drawingTool.textPanel.text")}:`,
                    {
                      injectTermsAsTooltips: true,
                      tooltipTerms:
                        viewState.terria.configParameters.helpContentTerms
                    }
                  )}
                </Text>
                <Input
                  styledHeight={"34px"}
                  dark
                  id="drawText"
                  type="text"
                  name="drawText"
                  value={this.title}
                  onChange={this.updateTitle}
                  placeholder="Text"
                  autoComplete="off"
                ></Input>
              </Box>
              <Spacing bottom={2} />
              <Selector
                viewState={viewState}
                value={this.currentLayout?.name}
                onChange={this.changeLayout}
                label={t("printTool.labels.layout")}
                spacingBottom
              >
                {this.layouts?.map((layout) => (
                  <option key={layout.name} value={layout.name}>
                    {layout.name}
                  </option>
                ))}
              </Selector>
              <Selector
                viewState={viewState}
                value={this.currentScale}
                onChange={this.changeScale}
                label={t("printTool.labels.scale")}
                spacingBottom
              >
                {this.currentLayout?.scaleList.map((scale) => (
                  <option key={`scale-${scale}`} value={scale}>
                    {scale}
                  </option>
                ))}
              </Selector>
              <Box fullWidth row>
                {this.isPrinting ? (
                  <ToolButton
                    splitter
                    fullWidth
                    round
                    onClick={this.cancelPrint.bind(this)}
                  >
                    {t("printTool.cancelPrint")}
                  </ToolButton>
                ) : (
                  <ToolButton
                    primary
                    fullWidth
                    round
                    onClick={this.onPrintButtonClick}
                  >
                    {t("printTool.printButton")}
                  </ToolButton>
                )}
              </Box>
            </MainPanel>
          )}
        </ToolPanel>
      </Text>
    );
  }

  @action.bound
  async onPrintButtonClick() {
    if (
      !isDefined(this.currentScale) ||
      !isDefined(this.currentLayout) ||
      !isDefined(this.pageBounds) ||
      !isDefined(this.terria.leaflet) ||
      !isDefined(this.terria.leaflet.map.options.crs)
    ) {
      return;
    }
    this.isPrinting = true;
    const map = this.terria.leaflet.map;

    const center = map.getCenter();
    const centerInProjection = map.options.crs!.project(center);
    const printLayers = [];
    const pageBounds = this.getPageBounds(map);
    for (let i = 0; i < this.terria.workbench.items.length; i++) {
      const item: any = this.terria.workbench.items[i];
      if (!item.show) continue;
      if (
        isDefined(item.maximumScale) &&
        item.maximumScale > 0 &&
        this.currentScale < item.maximumScale
      ) {
        continue;
      }
      if (item.encodeLayerForPrint) {
        const mapObject = await item.encodeLayerForPrint(
          pageBounds,
          this.currentLayout.printMapSize
        );
        if (mapObject) {
          if (Array.isArray(mapObject)) {
            printLayers.push(...mapObject);
          } else {
            printLayers.push(mapObject);
          }
        }
      }
    }
    const baseMap: any = this.terria.mainViewer.baseMap;
    if (baseMap && "encodeLayerForPrint" in baseMap) {
      const encodedBaseMap = baseMap.encodeLayerForPrint(
        pageBounds,
        this.currentLayout.printMapSize
      );
      if (Array.isArray(encodedBaseMap)) {
        printLayers.push(...encodedBaseMap);
      } else {
        printLayers.push(encodedBaseMap);
      }
    } else {
      printLayers.push({
        baseURL: "http://tile.openstreetmap.org/{z}/{x}/{y}.png",
        tileSize: [256, 256],
        type: "OSM",
        opacity: 1
      });
    }

    let fileName = this.title;
    const printConfig = this.terria.configParameters.printConfig;
    const defaultName = printConfig?.defaultName
      ? applyTranslationIfExists(printConfig.defaultName, this.props.i18n)
      : "";
    if (printConfig?.onlyDefaultName) {
      fileName = defaultName;
    } else if (printConfig?.namePosition === "start") {
      fileName = `${defaultName} ${fileName}`;
    } else {
      fileName = `${fileName} ${defaultName}`;
    }

    const attr = {
      layout: this.currentLayout.name,
      outputFilename: fileName,
      outputFormat: "pdf",

      attributes: {
        metadata: false,
        showLegend: false,
        title: this.title,
        map: {
          dpi: this.dpiForPdf,
          projection: "EPSG:3857",
          center: [centerInProjection.x, centerInProjection.y],
          scale: this.currentScale,
          layers: printLayers
        }
      }
    };
    this.createReport(attr);
  }

  getPageBounds(map: L.Map) {
    const pageBoundsContainer = this.pageBounds!;
    const neLL = map.containerPointToLatLng(
      new Point(pageBoundsContainer.maxX, pageBoundsContainer.minY)
    );
    const swLL = map.containerPointToLatLng(
      new Point(pageBoundsContainer.minX, pageBoundsContainer.maxY)
    );
    const ne = map.options.crs!.project(neLL);
    const sw = map.options.crs!.project(swLL);
    const pageBounds = {
      west: sw.x,
      south: sw.y,
      east: ne.x,
      north: ne.y
    };
    return pageBounds;
  }

  @action.bound
  private setCurrentScale(scale: number, isScaleSelectedManually?: boolean) {
    this.currentScale = scale;
    this.isScaleSelectedManually = defaultValue(isScaleSelectedManually, false);
  }

  printMask() {
    const map = this.terria.leaflet?.map;
    if (map) {
      this.updateMask = () => {
        this.createPrintMaskLeaflet(map);
      };
      this.updateMask();
      map.on("moveend", this.updateMask, this);
      map.on("zoomend", this.updateMask, this);
      this.removeListeners = () => {
        map.off("moveend", this.updateMask, this);
        map.off("zoomend", this.updateMask, this);
        this.updateMask = undefined;
        this.removeListeners = undefined;
      };
    }
  }

  private addCanvasLeaflet() {
    const mapContainer = this.terria.leaflet?.map.getContainer();
    if (mapContainer && !mapContainer.contains(this.printMaskCanvas)) {
      mapContainer.appendChild(this.printMaskCanvas);
    }
  }

  private removeCanvasLeaflet() {
    const mapContainer = this.terria.leaflet?.map.getContainer();
    if (mapContainer && mapContainer.contains(this.printMaskCanvas)) {
      mapContainer.removeChild(this.printMaskCanvas);
    }
  }

  private createPrintMaskLeaflet(map: L.Map): void {
    const resolution = calculateResolution(map);
    if (!this.isScaleSelectedManually) {
      const scale = this.getOptimalScale(
        map.getSize(),
        resolution,
        this.currentLayout!.printMapSize
      );
      this.setCurrentScale(scale);
    }

    this.addCanvasLeaflet();

    const context = this.printContext;
    if (context) {
      this.drawMask(map.getSize());
      const groundResolution = calculateResolution(map);
      this.drawPrintPage(
        map.getSize(),
        this.currentLayout?.printMapSize!,
        groundResolution
      );
      context.fillStyle = "rgba(0,5,25,0.55)";
      context.strokeStyle = "white";
      context.fill();
      context.stroke();
    }
  }

  private drawMask(viewportSize: Size) {
    const canvas = this.printMaskCanvas;
    const viewportWidth = viewportSize.x;
    const viewportHeight = viewportSize.y;
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const context = this.printContext;
    if (context) {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(viewportWidth, 0);
      context.lineTo(viewportWidth, viewportHeight);
      context.lineTo(0, viewportHeight);
      context.lineTo(0, 0);
      context.closePath();
    }
  }

  private drawPrintPage(
    viewportSize: Size,
    printMapSize: PrintMapSize,
    groundResolution: number
  ) {
    const center: Size = {
      x: viewportSize.x / 2,
      y: viewportSize.y / 2
    };
    const scale = this.currentScale!;
    const boundWidth =
      ((printMapSize.width / DOTS_PER_INCH / INCHES_PER_METER) * scale) /
      groundResolution;
    const boundHeight =
      ((printMapSize.height / DOTS_PER_INCH / INCHES_PER_METER) * scale) /
      groundResolution;
    this.pageBounds = {
      minX: center.x - boundWidth / 2,
      minY: center.y - boundHeight / 2,
      maxX: center.x + boundWidth / 2,
      maxY: center.y + boundHeight / 2
    };
    const context = this.printContext;
    if (context) {
      context.moveTo(this.pageBounds.minX, this.pageBounds.minY);
      context.lineTo(this.pageBounds.minX, this.pageBounds.maxY);
      context.lineTo(this.pageBounds.maxX, this.pageBounds.maxY);
      context.lineTo(this.pageBounds.maxX, this.pageBounds.minY);
      context.lineTo(this.pageBounds.minX, this.pageBounds.minY);
      context.closePath();
    }
  }

  private getOptimalScale(
    mapSize: Size,
    mapResolution: number,
    printMapSize: PrintMapSize
  ) {
    const scaleList = this.currentLayout!.scaleList;
    const mapWidth = mapSize.x * mapResolution;
    const mapHeight = mapSize.y * mapResolution;
    const scaleWidth =
      (mapWidth * INCHES_PER_METER * DOTS_PER_INCH) / printMapSize.width;
    const scaleHeight =
      (mapHeight * INCHES_PER_METER * DOTS_PER_INCH) / printMapSize.height;
    const scale = Math.min(scaleWidth, scaleHeight);
    let optimalScale = scaleList[0];

    scaleList.forEach(function (printMapScale: number) {
      if (scale > printMapScale) {
        optimalScale = printMapScale;
      }
    });

    return optimalScale;
  }

  private destroyPrintMask() {
    this.removeCanvasLeaflet();
    if (this.removeListeners) {
      this.removeListeners();
    }
  }

  private get printServerUrl() {
    const mapfishPrint = this.terria.configParameters.mapfishPrint;
    if (!mapfishPrint) {
      return;
    }
    let printConfig;
    printConfig = mapfishPrint[i18next.language];
    if (!printConfig) {
      printConfig = mapfishPrint.default;
    }
    let url = printConfig.url;
    if (url.length > 0 && url[url.length - 1] !== "/") {
      url += "/";
    }
    const mapId = printConfig.mapId;
    return url + mapId;
  }

  private async getStatus(ref: string) {
    const url = this.printServerUrl + `/status/${ref}.json`;
    loadJson(url)
      .then((statusResp: PrintStatusResponse) => {
        const done = statusResp.done;
        const status = statusResp.status;
        const terria = this.terria;
        if (status === "error") {
          const error = statusResp.error;
          throw new TerriaError({
            sender: "print tool",
            title: i18next.t("printTool.errorTitle"),
            message: i18next.t("printTool.errorMessageWithText", {
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>",
              error: error
            })
          });
        }
        if (done) {
          const ref = this.printReportRef;
          if (ref) {
            window.open(this.getReportUrl(ref));
            this.cleanPrintingState();
          } else {
            throw new TerriaError({
              sender: "print tool",
              title: i18next.t("printTool.errorTitle"),
              message: i18next.t("printTool.errorMessage", {
                email:
                  '<a href="mailto:' +
                  terria.supportEmail +
                  '">' +
                  terria.supportEmail +
                  "</a>"
              })
            });
          }
        } else {
          const ref = this.printReportRef;

          if (ref) {
            // The report is not ready yet. Check again in 1s.
            const that = this;
            this.statusTimeoutPromise = setTimeout(function () {
              that.getStatus(ref);
            }, 1000);
          } else {
            throw new TerriaError({
              sender: "print tool",
              title: i18next.t("printTool.errorTitle"),
              message: i18next.t("printTool.errorMessage", {
                email:
                  '<a href="mailto:' +
                  terria.supportEmail +
                  '">' +
                  terria.supportEmail +
                  "</a>"
              })
            });
          }
        }
      })
      .catch((e) => {
        if (e instanceof TerriaError) {
          this.terria.raiseErrorToUser(e);
          this.cleanPrintingState();
        }
      });
  }

  private getReportUrl(ref: string) {
    return this.printServerUrl + `/report/${ref}`;
  }

  cancelPrint() {
    const ref = this.printReportRef!;
    const printConfig = this.terria.configParameters.mapfishPrint;
    let printServerUrl = printConfig!.url!;
    const url = printServerUrl + `cancel/${ref}`;
    if (this.statusTimeoutPromise) {
      clearTimeout(this.statusTimeoutPromise);
    }

    loadWithXhr({ url: url, method: "DELETE" })
      .then(() => {
        this.cleanPrintingState();
      })
      .catch((e: any) => {
        this.cleanPrintingState();
        throw new DeveloperError(e);
      });
  }

  private async createReport(printBody: JsonObject) {
    return loadWithXhr({
      url: this.printServerUrl + "/report.pdf",
      data: JSON.stringify(printBody),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      responseType: "json"
    })
      .then((resp: PrintReportResponse) => {
        const ref = resp.ref;
        this.printReportRef = ref;
        return this.getStatus(ref);
      })
      .catch((e: any) => {
        this.cleanPrintingState();
        throw new DeveloperError(e);
      });
  }

  @action.bound
  private cleanPrintingState() {
    this.isPrinting = false;
    this.printReportRef = undefined;
  }
}

const calculateResolution = function (map: any) {
  const center = map.getCenter();
  const zoomLevel = map.getZoom();
  const projection = map.options.crs.projection;

  const resolution =
    (2 * projection.R * Math.PI) / (256 * Math.pow(2, zoomLevel));
  return resolution;
};

const ToolButton = styled(Button)`
  ${(props) => props.roundLeft && `border-radius: 20px 0 0 20px;`}
  ${(props) => props.roundRight && `border-radius: 0 20px 20px 0;`}
  ${(props) => props.round && `border-radius: 20px 20px 20px 20px;`}
`;

export default withTranslation()(withTheme(PrintToolPanel));
