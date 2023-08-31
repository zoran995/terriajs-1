export interface GeojsonPrintLayer {
  type: "geojson";
  geoJson: String | any;
  name?: String;
  opacity?: String;
  renderAsSvg?: boolean;
  style?: {};
}

export interface GmlPrintLayer {
  type: "gml";
  url: String;
  name?: String;
  opacity?: String;
  renderAsSvg?: boolean;
  style?: {};
}

export interface PrintStyle {
  pointStyle: PointPrintStyle | PointPrintStyleGraphics;
  lineStyle: LinePrintStyle;
  polygonStyle: PolygonPrintStyle;
}

export interface PointPrintStyle {
  type: "point";
  fillColor: string;
  fillOpacity: number;
  rotation?: number;
  pointRadius: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeLinecap?: string;
  strokeDashstyle?: string;
}

export interface TextPrintStyle {
  type: "text";
  fontColor: string;
  fontFamily: string;
  fontSize: string;
  fontStyle?: string;
  fontWeight?: string;
  haloColor?: string;
  haloOpacity?: number;
  haloRadius?: number;
  label: string;
  fillColor?: string;
  fillOpacity?: number;
  labelAlign?: string;
  labelRotation?: number;
  labelXOffset?: number;
  labelYOffset?: number;
}

export interface PointPrintStyleGraphics {
  type: "point";
  graphicName?: string;
  externalGraphic?: string;
  graphicOpacity: number;
  pointRadius: number;
  rotation?: number;
}

export interface LinePrintStyle {
  type: "line";
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeLinecap?: string;
  strokeDashstyle?: string;
}

export interface PolygonPrintStyle {
  type: "polygon";
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeLinecap?: string;
  strokeDashstyle?: string;
}
