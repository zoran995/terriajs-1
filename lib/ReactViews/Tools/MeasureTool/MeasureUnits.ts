import i18next from "i18next";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import {
  prettifyProjectionGK,
  prettifyProjectionUTM
} from "../../../Map/Vector/Projection";
import { DrawTypeEnum } from "../../../Models/Drawing/DrawType";
import prettifyCoordinates from "./../../../Map/Vector/prettifyCoordinates";

export interface MeasureUnits {
  id: number;
  name: string;
  label: string;
  prettifyResult(number: number | Cartesian3): string;
}

export interface MeasureType {
  type: DrawTypeEnum;
  name: string;
  units: MeasureUnits[];
}

function prettifyDistanceArea(value: number, label: string): string {
  if (value <= 0) {
    return "";
  }
  const convertedValue = value
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return convertedValue + " " + label;
}

const distanceUnits: MeasureUnits[] = [
  {
    id: 0,
    name: "measureTool.distance.meters.name",
    label: "measureTool.distance.meters.label",
    prettifyResult: function (number: number) {
      return prettifyDistanceArea(
        number,
        i18next.t("measureTool.distance.meters.label")
      );
    }
  },
  {
    id: 1,
    name: "measureTool.distance.kilometers.name",
    label: "measureTool.distance.kilometers.label",
    prettifyResult: function (number: number) {
      return prettifyDistanceArea(
        number / 1000,
        i18next.t("measureTool.distance.kilometers.label")
      );
    }
  }
];

const areaUnits: MeasureUnits[] = [
  {
    id: 0,
    name: "measureTool.area.sqMeters.name",
    label: "measureTool.area.sqMeters.label",
    prettifyResult: function (number: number) {
      return prettifyDistanceArea(
        number,
        i18next.t("measureTool.area.sqMeters.label")
      );
    }
  },
  {
    id: 1,
    name: "measureTool.area.hectares.name",
    label: "measureTool.area.hectares.label",
    prettifyResult: function (number: number) {
      return prettifyDistanceArea(
        number / 10000,
        i18next.t("measureTool.area.hectares.label")
      );
    }
  }
];

const coordinateUnits: MeasureUnits[] = [
  {
    id: 0,
    name: "measureTool.coordinates.WGS.name",
    label: "measureTool.coordinates.WGS.label",
    prettifyResult: function (position: Cartesian3) {
      const latLon = cartesianToDegrees(position);
      const pretty = prettifyCoordinates(latLon.longitude, latLon.latitude);
      return "Lat: " + pretty.latitude + ", " + "Lon: " + pretty.longitude;
    }
  },
  {
    id: 1,
    name: "measureTool.coordinates.UTM.name",
    label: "measureTool.coordinates.UTM.label",
    prettifyResult: function (position: Cartesian3) {
      const latLon = cartesianToDegrees(position);
      const prettyProjection = prettifyProjectionUTM(
        latLon.longitude,
        latLon.latitude
      );
      return (
        "ZONE " +
        prettyProjection.zone +
        " E " +
        prettyProjection.east +
        " N " +
        prettyProjection.north
      );
    }
  },
  {
    id: 2,
    name: "measureTool.coordinates.GK.name",
    label: "measureTool.coordinates.GK.label",
    prettifyResult: function (position: Cartesian3) {
      const latLon = cartesianToDegrees(position);
      const prettyProjection = prettifyProjectionGK(
        latLon.longitude,
        latLon.latitude
      );
      return (
        "ZONE " +
        prettyProjection.zone +
        " E " +
        prettyProjection.east +
        " N " +
        prettyProjection.north
      );
    }
  }
];

export const measureTypes: MeasureType[] = [
  {
    type: DrawTypeEnum.LINE,
    name: "measureTool.distance.name",
    units: distanceUnits
  },
  {
    type: DrawTypeEnum.POLYGON,
    name: "measureTool.area.name",
    units: areaUnits
  },
  {
    type: DrawTypeEnum.POINT,
    name: "measureTool.coordinates.name",
    units: coordinateUnits
  }
];

function cartesianToDegrees(cartesian: Cartesian3) {
  const carto = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
  return {
    longitude: CesiumMath.toDegrees(carto.longitude),
    latitude: CesiumMath.toDegrees(carto.latitude)
  };
}
