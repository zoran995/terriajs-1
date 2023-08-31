import i18next from "i18next";
import { action, observable, runInAction, makeObservable } from "mobx";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import URI from "urijs";
import isDefined from "../Core/isDefined";
import loadJson from "../Core/loadJson";
import TerriaError from "../Core/TerriaError";
import { addMarker, removeMarker } from "./LocationMarkerUtils";
import Terria from "./Terria";

const proj4: any = require("proj4/lib/index.js").default;
const proj4longlat =
  "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";
const proj4ProjectionGK5 =
  "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +units=m +no_defs ";
const proj4ProjectionGK6 =
  "+proj=tmerc +lat_0=0 +lon_0=18 +k=0.9999 +x_0=6500000 +y_0=0 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +units=m +no_defs ";
const proj4ProjectionGK7 =
  "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.9999 +x_0=7500000 +y_0=0 +ellps=bessel +towgs84=682,-203,480,0,0,0,0 +units=m +no_defs ";

export interface Municipality {
  id?: number;
  nameCyr?: string;
  name?: string;
}

type TipEvidencijeType = "KNN" | "KZ" | "KN";

interface IEvidenceType {
  cadastralMunicipalityId: number;
  evidenceType: TipEvidencijeType;
}

export interface CadastralMunicipality {
  municipalityId?: number;
  evidenceTypes: IEvidenceType[];
  nameCyr?: string;
  name: string;
}

export interface ServerCadastralMunicipality {
  id: number;
  municipalityId?: number;
  kt: string;
  nameCyr?: string;
  name: string;
}

interface DkpOptions {
  terria: Terria;
}

const evidenceTypeRefSort: TipEvidencijeType[] = ["KNN", "KN", "KZ"];

export default class DkpManager {
  @observable errorMessage?: string;
  @observable isSearching: boolean = false;
  private terria: Terria;

  constructor(options: DkpOptions) {
    makeObservable(this);
    this.terria = options.terria;
    this.loadMunicipalities();
  }

  async loadMunicipalities(): Promise<Municipality[]> {
    return loadJson("api/cadastre/municipality").catch((e) => {
      runInAction(() => {
        if (!e || !e.response) {
          this.errorMessage = i18next.t("dkpSearch.errors.genericError");
        }
        const response = JSON.parse(e.response);
        if (response && response.status === "ETIMEDOUT") {
          this.errorMessage = i18next.t("dkpSearch.errors.connectionTimeout");
        } else {
          this.errorMessage = i18next.t("dkpSearch.errors.genericError");
        }
        this.isSearching = false;
      });
    });
  }

  @action.bound
  async updateCadastralMunicipalities(currentMunicipality: Municipality) {
    return await loadJson(
      "api/cadastre/cadastralMunicipality/?municipalityId=" +
        currentMunicipality?.id
    )
      .then((result: ServerCadastralMunicipality[]) => {
        const parsedCadastralMunicipalities: CadastralMunicipality[] =
          parseCadMunicipalities(result);
        return parsedCadastralMunicipalities;
      })
      .catch((e) => {
        runInAction(() => {
          if (!e || !e.response) {
            this.errorMessage = i18next.t("dkpSearch.errors.genericError");
          }
          const response = JSON.parse(e.response);
          if (response && response.status === "ETIMEDOUT") {
            this.errorMessage = i18next.t("dkpSearch.errors.connectionTimeout");
          } else {
            this.errorMessage = i18next.t("dkpSearch.errors.genericError");
          }
          this.isSearching = false;
        });
      });
  }

  @action.bound
  async searchParcel(
    currentMunicipality: Municipality,
    currentCadastralMunicipality: CadastralMunicipality,
    parcelNumber: string
  ) {
    removeMarker(this.terria);
    this.isSearching = true;
    this.errorMessage = undefined;
    if (currentMunicipality && currentCadastralMunicipality && parcelNumber) {
      const splitParcelNumber = parcelNumber.split("/");
      const municipalityId = currentMunicipality.id!;
      const evidenceTypesSorted =
        currentCadastralMunicipality.evidenceTypes.sort(function (a, b) {
          return (
            evidenceTypeRefSort.indexOf(a.evidenceType) -
            evidenceTypeRefSort.indexOf(b.evidenceType)
          );
        });
      for (let i = 0; i < evidenceTypesSorted.length; i++) {
        const evidenceType = evidenceTypesSorted[i];
        const url = this.createParcelUrl(
          municipalityId,
          evidenceType.cadastralMunicipalityId,
          evidenceType.evidenceType,
          splitParcelNumber[0],
          splitParcelNumber[1]
        );
        await loadJson(url)
          .then((res) => {
            this.parseParcelResponse(res);
          })
          .catch((e) => {
            if (i < evidenceTypesSorted.length - 1 && this.isSearching) {
              return;
            } else {
              runInAction(() => {
                this.isSearching = false;
                if (!e || !e.response) {
                  this.errorMessage = i18next.t(
                    "dkpSearch.errors.genericError"
                  );
                }
                const response = JSON.parse(e.response);
                if (response && response.status === "ETIMEDOUT") {
                  this.errorMessage = i18next.t(
                    "dkpSearch.errors.connectionTimeout"
                  );
                } else if (response && response.status === "ENOTFOUND") {
                  this.errorMessage = i18next.t("dkpSearch.errors.notFound");
                } else {
                  this.errorMessage = i18next.t(
                    "dkpSearch.errors.genericError"
                  );
                }
              });
            }
          });

        if (!this.isSearching) {
          // parcel was found leave the loop
          break;
        }
      }
    } else {
      this.isSearching = false;
      this.terria.raiseErrorToUser(
        new TerriaError({
          sender: this,
          title: i18next.t("dkpSearch.errors.missingInputErrorTitle"),
          message: i18next.t("dkpSearch.errors.missingInputError")
        })
      );
    }
  }

  createParcelUrl(
    municipalityId: number,
    cadastralMunicipalityId: number,
    evidenceType: TipEvidencijeType,
    parcelNumber: number | string,
    parcelSubNumber?: number | string
  ): string {
    const service = new URI("api/cadastre/cadastralParcel/");
    service.addQuery("municipalityId", municipalityId);
    service.addQuery("cadastralMunicipalityId", cadastralMunicipalityId);
    service.addQuery("evidenceType", evidenceType);

    service.addQuery("parcelNumber", parcelNumber);

    if (isDefined(parcelSubNumber)) {
      service.addQuery("parcelSubNumber", parcelSubNumber);
    }

    return service.toString();
  }

  @action.bound
  parseParcelResponse(res: any) {
    const bbox = calcProjection(res.bbox);
    const centroid = convertCentroid(res.centroid);
    const bboxTopLeft = bbox ? bbox.topLeft : undefined;
    const bboxBottomRight = bbox ? bbox.bottomRight : undefined;
    if (bboxTopLeft && bboxBottomRight) {
      const rectangle = Rectangle.fromDegrees(
        bboxTopLeft[0],
        bboxBottomRight[1],
        bboxBottomRight[0],
        bboxTopLeft[1]
      );
      this.terria.currentViewer.zoomTo(rectangle, 1.5);
      const latlon = {
        latitude: centroid[1],
        longitude: centroid[0]
      };
      addMarker(this.terria, {
        name: "parcel",
        location: latlon
      });
      this.isSearching = false;
    }
  }
}

export function parseCadMunicipalities(result: ServerCadastralMunicipality[]) {
  const cadastralMunicipalities: CadastralMunicipality[] = [];
  for (let i = 0; i < result.length; i++) {
    const cadastralMunicipality = result[i];
    if (
      cadastralMunicipalities.some((obj) => {
        return obj.name === cadastralMunicipality.name;
      })
    ) {
      continue;
    }
    const bb = result.filter((obj) => obj.name === cadastralMunicipality.name);
    const evidenceType: IEvidenceType[] = [];
    bb.forEach((element) => {
      const tip: TipEvidencijeType = element.kt as TipEvidencijeType;
      const tipEvidencijeObj: IEvidenceType = {
        cadastralMunicipalityId: element.id,
        evidenceType: tip
      };
      evidenceType.push(tipEvidencijeObj);
    });
    const cc: CadastralMunicipality = {
      municipalityId: cadastralMunicipality.municipalityId,
      evidenceTypes: evidenceType,
      nameCyr: cadastralMunicipality.nameCyr,
      name: cadastralMunicipality.name
    };
    cadastralMunicipalities.push(cc);
  }
  const parsedCadMunicipalities = cadastralMunicipalities.sort((a, b) => {
    const textA = a.name!.toUpperCase();
    const textB = b.name!.toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  });
  return parsedCadMunicipalities as CadastralMunicipality[];
}

function calcProjection(bbox: any) {
  const digitY = ("" + bbox.East)[0];
  const digitX = ("" + bbox.West)[0];

  if (digitY === "5") {
    const bboxBottomRight = convertProjection(proj4ProjectionGK5, [
      bbox.East,
      bbox.South
    ]);
    const bboxTopLeft = convertProjection(proj4ProjectionGK5, [
      bbox.West,
      bbox.North
    ]);
    return { bottomRight: bboxBottomRight, topLeft: bboxTopLeft };
  } else if (digitY === "6") {
    const bboxBottomRight = convertProjection(proj4ProjectionGK6, [
      bbox.East,
      bbox.South
    ]);
    const bboxTopLeft = convertProjection(proj4ProjectionGK6, [
      bbox.West,
      bbox.North
    ]);
    return { bottomRight: bboxBottomRight, topLeft: bboxTopLeft };
  } else if (digitY === "7") {
    const bboxBottomRight = convertProjection(proj4ProjectionGK7, [
      bbox.East,
      bbox.South
    ]);
    const bboxTopLeft = convertProjection(proj4ProjectionGK7, [
      bbox.West,
      bbox.North
    ]);
    return { bottomRight: bboxBottomRight, topLeft: bboxTopLeft };
  }
}

function convertCentroid(centroid: any) {
  const digitY = ("" + centroid.Y)[0];
  if (digitY === "5") {
    return convertProjection(proj4ProjectionGK5, [centroid.Y, centroid.X]);
  } else if (digitY === "6") {
    return convertProjection(proj4ProjectionGK6, [centroid.Y, centroid.X]);
  } else if (digitY === "7") {
    return convertProjection(proj4ProjectionGK7, [centroid.Y, centroid.X]);
  }
}

function convertProjection(projDef: string, coordinate: [number, number]) {
  return proj4(projDef, proj4longlat, coordinate);
}
