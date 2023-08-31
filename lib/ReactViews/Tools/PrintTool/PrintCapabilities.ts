import loadWithXhr from "../../../Core/loadWithXhr";
import loadJson from "../../../Core/loadJson";
import isDefined from "../../../Core/isDefined";

type SupportedFormats = "pdf" | "tif" | "tiff" | "png";

interface CapabilitiesJson {
  appName: string;
  layouts: CapabilitiesLayout[];
  formats: SupportedFormats[];
}

interface CapabilitiesLayout {
  name: string;
  attributes: any[];
}

export default class PrintCapabilities {
  static fromUrl(url: string) {
    const capabilitiesUrl = url + "/capabilities.json";
    return Promise.resolve(loadJson(capabilitiesUrl)).then(function (
      capabilitiesJson
    ) {
      return new PrintCapabilities(capabilitiesJson);
    });
  }

  readonly layouts: PrintLayout[];
  readonly layoutsByName: {
    readonly [name: string]: PrintLayout;
  };

  constructor(readonly json: CapabilitiesJson) {
    this.layouts = [];
    this.layoutsByName = {};

    const layoutsByName: { [name: string]: PrintLayout } = this.layoutsByName;

    this.json.layouts.forEach((capabilitiesLayout: CapabilitiesLayout) => {
      const name = capabilitiesLayout.name;
      const scaleList = this.getScaleList(capabilitiesLayout);
      const isLegendAvailable = this.isLegendAvailable(capabilitiesLayout);
      const isScaleAvailable = this.isScaleAvailable(capabilitiesLayout);
      const printMapSize = this.getPrintMapSize(capabilitiesLayout);
      const dpiSuggestions = this.getDpiSuggestion(capabilitiesLayout);
      const printLayout = new PrintLayout({
        name: name,
        scaleList: scaleList,
        isLegendAvailable: isLegendAvailable,
        isScaleAvailable: isScaleAvailable,
        printMapSize: printMapSize,
        dpiSuggestions: dpiSuggestions,
        capabilitiesLayout: capabilitiesLayout
      });
      this.layouts.push(printLayout);
      layoutsByName[name] = printLayout;
    });
  }

  private isLegendAvailable(capabilitiesLayout: CapabilitiesLayout): boolean {
    return isDefined(getAttributeInLayoutByName(capabilitiesLayout, "legend"));
  }

  private isScaleAvailable(capabilitiesLayout: CapabilitiesLayout): boolean {
    return isDefined(getAttributeInLayoutByName(capabilitiesLayout, "scale"));
  }

  private getPrintMapSize(
    capabilitiesLayout: CapabilitiesLayout
  ): PrintMapSize {
    const layoutMapInfo = getAttributeInLayoutByName(
      capabilitiesLayout,
      "map"
    ).clientInfo;
    return {
      width: layoutMapInfo.width,
      height: layoutMapInfo.height
    };
  }

  private getScaleList(capabilitiesLayout: CapabilitiesLayout): number[] {
    const layoutMapInfo = getAttributeInLayoutByName(
      capabilitiesLayout,
      "map"
    ).clientInfo;
    const scales = layoutMapInfo.scales.sort((a: number, b: number) => {
      return a - b;
    });
    return scales;
  }

  private getDpiSuggestion(capabilitiesLayout: CapabilitiesLayout): number[] {
    const layoutMapInfo = getAttributeInLayoutByName(
      capabilitiesLayout,
      "map"
    ).clientInfo;
    const dpiSuggestions = layoutMapInfo.dpiSuggestions.sort(
      (a: number, b: number) => {
        return a - b;
      }
    );
    return dpiSuggestions;
  }
}

const getAttributeInLayoutByName = function (
  layout: CapabilitiesLayout,
  name: string
) {
  const attributes = layout.attributes;
  for (const index in attributes) {
    if (attributes[index].name === name) {
      return attributes[index];
    }
  }
  return;
};

interface PrinLayoutOptions {
  name: string;
  scaleList: number[];
  isLegendAvailable: boolean;
  isScaleAvailable: boolean;
  printMapSize: PrintMapSize;
  dpiSuggestions: number[];
  capabilitiesLayout: CapabilitiesLayout;
}

export interface PrintMapSize {
  height: number;
  width: number;
}

export class PrintLayout {
  readonly name: string;
  readonly scaleList: number[];
  readonly isLegendAvailable: boolean;
  readonly capabilitiesLayout: CapabilitiesLayout;
  readonly printMapSize: PrintMapSize;
  readonly dpiSuggestions: number[];

  constructor(options: PrinLayoutOptions) {
    this.name = options.name;
    this.scaleList = options.scaleList;
    this.isLegendAvailable = options.isLegendAvailable;
    this.capabilitiesLayout = options.capabilitiesLayout;
    this.printMapSize = options.printMapSize;
    this.dpiSuggestions = options.dpiSuggestions;
  }
}
