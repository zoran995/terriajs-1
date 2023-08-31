import {
  PointPrintStyle,
  LinePrintStyle,
  PolygonPrintStyle,
  TextPrintStyle
} from "../Models/printLayers";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import Terria from "../Models/Terria";
import EntityCollection from "terriajs-cesium/Source/DataSources/EntityCollection";
import { toMercator } from "@turf/projection";

interface GeojsonGeometryPoint {
  type: "Point";
  coordinates: number[];
}

interface GeojsonGeometryLineString {
  type: "LineString";
  coordinates: number[][];
}

interface GeojsonGeometryPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export default function entityCollectionToGeoJsonAndPrintStyle(
  terria: Terria,
  entities: EntityCollection,
  mercator: boolean = false
) {
  const time = terria.timelineClock.currentTime;
  const featureCollection = [];
  interface Style {
    [key: string]:
      | {
          symbolizers:
            | PointPrintStyle[]
            | LinePrintStyle[]
            | PolygonPrintStyle[]
            | TextPrintStyle[];
        }
      | number;
  }
  const style: Style = {
    version: 2
  };
  for (let i = 0; i < entities.values.length; i++) {
    const entity = entities.values[i];
    const properties: any = entity.properties?.getValue(time) || {};
    let geometry:
      | GeojsonGeometryPoint
      | GeojsonGeometryLineString
      | GeojsonGeometryPolygon
      | undefined = undefined;
    if (entity.polygon) {
      const polygon = entity.polygon;
      const positions = entity.polygon.hierarchy?.getValue(time).positions;
      const coordinates: number[][] = [];
      const polygonCoordinates: number[][][] = [];
      const cartographics =
        Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
      for (let j = 0; j < cartographics.length; j++) {
        const cartographic = cartographics[j];
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        coordinates.push([longitude, latitude]);
      }
      polygonCoordinates.push(coordinates);
      const holes = entity.polygon.hierarchy?.getValue(time).holes;
      for (let j = 0; j < holes.length; j++) {
        const hole = holes[j];
        const positions = hole.positions;
        const coordinates: number[][] = [];
        const cartographics =
          Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
        for (let k = 0; k < cartographics.length; k++) {
          const cartographic = cartographics[k];
          const latitude = CesiumMath.toDegrees(cartographic.latitude);
          const longitude = CesiumMath.toDegrees(cartographic.longitude);
          coordinates.push([longitude, latitude]);
        }
        polygonCoordinates.push(coordinates);
      }
      properties._geoportal_style = `geoportal_${i}`;
      geometry = {
        type: "Polygon",
        coordinates: polygonCoordinates
      };

      style[`[_geoportal_style = '${properties._geoportal_style}']`] = {
        symbolizers: [
          {
            type: "polygon",
            fillColor: (<ColorMaterialProperty>polygon.material).color
              ?.getValue(time)
              .withAlpha(1)
              .toCssHexString(),
            fillOpacity:
              (<ColorMaterialProperty>polygon.material).color?.getValue(time)
                .alpha || 1,
            strokeColor: polygon.outlineColor
              ?.getValue(time)
              .withAlpha(1)
              .toCssHexString(),
            strokeOpacity: polygon.outlineColor?.getValue(time).alpha,
            strokeWidth: polygon.outlineWidth?.getValue(time) || 1,
            strokeLinecap: "round"
          }
        ]
      };
    } else if (entity.polyline) {
      const polyline = entity.polyline;
      const positions = entity.polyline.positions?.getValue(
        terria.timelineClock.currentTime
      );
      const coordinates: number[][] = [];
      const cartographics =
        Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
      for (let j = 0; j < cartographics.length; j++) {
        const cartographic = cartographics[j];
        const latitude = CesiumMath.toDegrees(cartographic.latitude);
        const longitude = CesiumMath.toDegrees(cartographic.longitude);
        coordinates.push([longitude, latitude]);
      }
      properties._geoportal_style = `geoportal_${i}`;
      geometry = {
        type: "LineString",
        coordinates: coordinates
      };

      style[`[_geoportal_style = '${properties._geoportal_style}']`] = {
        symbolizers: [
          {
            type: "line",

            strokeColor: (<ColorMaterialProperty>polyline.material).color
              ?.getValue(time)
              .withAlpha(1)
              .toCssHexString(),
            strokeOpacity: (<ColorMaterialProperty>(
              polyline.material
            )).color?.getValue(time).alpha,
            strokeWidth: polyline.width?.getValue(time) || 1,
            strokeLinecap: "round"
          }
        ]
      };
    } else if (entity.point || entity.label) {
      const position = entity.position!.getValue(time);
      const cartographic = Ellipsoid.WGS84.cartesianToCartographic(position);
      const latitude = CesiumMath.toDegrees(cartographic.latitude);
      const longitude = CesiumMath.toDegrees(cartographic.longitude);
      properties._geoportal_style = `geoportal_${i}`;
      geometry = {
        type: "Point",
        coordinates: [longitude, latitude]
      };
      if (entity.point) {
        const point = entity.point;
        style[`[_geoportal_style = '${properties._geoportal_style}']`] = {
          symbolizers: [
            {
              type: "point",
              fillColor: point
                .color!.getValue(time)
                .withAlpha(1)
                .toCssHexString(),
              fillOpacity: point.color?.getValue(time).alpha || 1,
              pointRadius: (point.pixelSize?.getValue(time) || 6) / 2,
              strokeColor: point.outlineColor
                ?.getValue(time)
                .withAlpha(1)
                .toCssHexString(),
              strokeOpacity: point.outlineColor?.getValue(time).alpha,
              strokeWidth: point.outlineWidth?.getValue(time),
              strokeLinecap: "round"
            }
          ]
        };
      } else if (entity.label) {
        const label = entity.label;
        const font = label.font?.getValue(time);
        const fontElements = font.split("px ");
        style[`[_geoportal_style = '${properties._geoportal_style}']`] = {
          symbolizers: [
            {
              type: "text",
              label: label.text?.getValue(time) || "",
              fontColor:
                label.fillColor?.getValue(time).withAlpha(1).toCssHexString() ||
                "#FF0000",
              fontFamily: fontElements[1] || "sans-serif",
              fontSize: `${fontElements[0]}px`
            }
          ]
        };
      }
    }
    if (geometry) {
      const feature = {
        type: "Feature",
        properties: properties,
        geometry: geometry
      };
      featureCollection.push(feature);
    }
  }
  const geojson = { type: "FeatureCollection", features: featureCollection };
  if (mercator) {
    toMercator(geojson, { mutate: true });
  }

  const geojsonAndStyle: {
    geojson: any;
    style: any;
  } = { geojson: geojson, style: style };
  return geojsonAndStyle;
}
