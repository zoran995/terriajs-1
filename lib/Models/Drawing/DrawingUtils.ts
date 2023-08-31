import Color from "terriajs-cesium/Source/Core/Color";
import { DrawTypeEnum } from "./DrawType";

export interface DrawMode {
  type: DrawTypeEnum;
  name: string;
}

export const drawModes: DrawMode[] = [
  {
    type: DrawTypeEnum.POINT,
    name: "drawingTool.point"
  },
  {
    type: DrawTypeEnum.LINE,
    name: "drawingTool.line"
  },
  {
    type: DrawTypeEnum.POLYGON,
    name: "drawingTool.polygon"
  },
  {
    type: DrawTypeEnum.LABEL,
    name: "drawingTool.label"
  }
];

enum ColorListEnum {
  BLACK,
  RED,
  BLUE,
  WHITE,
  GREEN
}

export interface ColorInterface {
  type: ColorListEnum;
  value: Color;
}

const colorList: ColorInterface[] = [
  {
    type: ColorListEnum.BLACK,
    value: Color.BLACK
  },
  {
    type: ColorListEnum.RED,
    value: Color.RED
  },
  {
    type: ColorListEnum.BLUE,
    value: Color.BLUE
  },
  {
    type: ColorListEnum.WHITE,
    value: Color.WHITE
  },
  {
    type: ColorListEnum.GREEN,
    value: Color.GREEN
  }
];

interface PointStyles {
  pointSizes: number[];
  colorList: ColorInterface[];
}
export const pointStyles: PointStyles = {
  pointSizes: [6, 8, 10, 12, 14],
  colorList: colorList
};

interface LineStyles {
  lineWidths: number[];
  colorList: ColorInterface[];
}

export const lineStyles: LineStyles = {
  lineWidths: [1, 2, 4, 6, 8, 10],
  colorList: colorList
};

interface PolygonStyles {
  outlineWidths: number[];
  fillColorList: ColorInterface[];
  outlineColorList: ColorInterface[];
}

export const polygonStyles: PolygonStyles = {
  outlineWidths: [1, 2, 4, 6, 8, 10],
  fillColorList: colorList,
  outlineColorList: colorList
};

enum FontEnum {
  TimesNewRoman,
  Helvetica
}

export interface FontType {
  type: FontEnum;
  name: string;
  cssName: string;
}

const fontList: FontType[] = [
  {
    type: FontEnum.TimesNewRoman,
    name: "Times New Roman",
    cssName: "Times New Roman"
  },
  {
    type: FontEnum.Helvetica,
    name: "Helvetica",
    cssName: "Helvetica"
  }
];

interface TextStyles {
  sizes: number[];
  fonts: FontType[];
  colorList: ColorInterface[];
}

export const textStyles: TextStyles = {
  sizes: [10, 12, 14, 16, 18],
  fonts: fontList,
  colorList: colorList
};
