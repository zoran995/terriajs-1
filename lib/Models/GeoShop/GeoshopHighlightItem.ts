import { Geometry, GeometryCollection, Properties } from "@turf/helpers";
import {
  computed,
  makeObservable,
  observable,
  override,
  runInAction
} from "mobx";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import GeoJsonDataSource from "terriajs-cesium/Source/DataSources/GeoJsonDataSource";
import TableColorStyleTraits from "../../Traits/TraitsClasses/Table/ColorStyleTraits";
import TableOutlineStyleTraits, {
  OutlineSymbolTraits
} from "../../Traits/TraitsClasses/Table/OutlineStyleTraits";
import TableStyleTraits from "../../Traits/TraitsClasses/Table/StyleTraits";
import GeoJsonCatalogItem from "../Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../Definition/CommonStrata";
import createStratumInstance from "../Definition/createStratumInstance";
import Terria from "../Terria";
import {
  FeatureCollectionWithCrs,
  reprojectToGeographic
} from "./../../ModelMixins/GeojsonMixin";
import GeoShopMixin from "../../ModelMixins/GeoshopMixin";

export class GeoShopHighlightItem extends GeoJsonCatalogItem {
  private _geoShopDataSource = new CustomDataSource("GeoshopHighlight");

  @observable
  private _data: FeatureCollectionWithCrs<
    Geometry | GeometryCollection,
    Properties
  > = {
    type: "FeatureCollection",
    features: []
  };

  constructor(
    id: string | undefined,
    terria: Terria,
    name: string,
    private readonly parentItem: GeoShopMixin.Instance
  ) {
    super(id, terria);
    makeObservable(this);

    this.setTrait(CommonStrata.override, "name", name);
    this.setTrait(CommonStrata.override, "disableAboutData", true);

    this.setTrait(CommonStrata.user, "useOutlineColorForLineFeatures", true);

    this.setTrait(
      CommonStrata.user,
      "defaultStyle",
      createStratumInstance(TableStyleTraits, {
        outline: createStratumInstance(TableOutlineStyleTraits, {
          null: createStratumInstance(OutlineSymbolTraits, {
            width: 4,
            color: this.terria.baseMapContrastColor
          })
        }),
        color: createStratumInstance(TableColorStyleTraits, {
          nullColor: "rgba(255,0,0,0)"
        })
      })
    );
  }

  @override
  get mapItems() {
    return [this._geoShopDataSource];
  }

  @override
  get attributeTable() {
    if (this._data)
      return this.createAttributeTableFromFeatureCollection(
        this._data,
        this.terria
      );
  }

  async addEntities(
    featureCollection: FeatureCollectionWithCrs<
      Geometry | GeometryCollection,
      Properties
    >
  ) {
    const geoJsonWgs84 = await reprojectToGeographic(
      featureCollection as any,
      this.terria.configParameters.proj4ServiceBaseUrl
    );

    const dataSource = await GeoJsonDataSource.load(
      geoJsonWgs84,
      this.stylesWithDefaults
    );
    for (const entity of dataSource.entities.values) {
      if (
        this.parentItem.shouldUseItemId &&
        this._geoShopDataSource.entities.removeById(entity.id)
      ) {
        geoJsonWgs84.features = geoJsonWgs84.features.filter(
          (feature) => feature.id !== entity.id
        );
        runInAction(() => {
          this._data.features = this._data?.features.filter(
            (feature) => feature.id !== entity.id
          );
        });
        continue;
      } else if (
        !this.parentItem.shouldUseItemId &&
        this.terria.geoshopCatalogItem?.dataUniqueIdentifiers
      ) {
        const entityIdentifier =
          this.terria.geoshopCatalogItem?.dataUniqueIdentifiers.reduce(
            (acc, identifier) => {
              return `${acc}${entity.properties?.[identifier]?.getValue?.()}`;
            },
            ""
          );

        let removed = false;
        for (let index = this._data.features.length - 1; index >= 0; index--) {
          const feature = this._data.features[index];

          const dataIdentifier =
            this.terria.geoshopCatalogItem?.dataUniqueIdentifiers.reduce(
              (acc, identifier) => {
                return `${acc}${feature.properties?.[identifier]}`;
              },
              ""
            );
          if (dataIdentifier === entityIdentifier) {
            this._geoShopDataSource.entities.removeById(feature.id as never);
            geoJsonWgs84.features = geoJsonWgs84.features.filter(
              (feat) => feat.id !== entity.id
            );
            runInAction(() => {
              this._data.features.splice(index, 1);
            });
            removed = true;
          }
        }
        if (removed) continue;
      }
      this._geoShopDataSource.entities.add(entity);
    }
    runInAction(() => {
      const features = [
        ...(this._data?.features ?? []),
        ...geoJsonWgs84.features
      ];
      this._data = { ...this._data!, features };
    });
  }

  clean() {
    this._geoShopDataSource.entities.removeAll();
    runInAction(() => {
      this._data = { type: "FeatureCollection", features: [] };
    });
  }

  @computed
  get itemsCount() {
    return this._data?.features.length ?? 0;
  }

  get selectedItemsProperties() {
    return this._data?.features.map((feature) => {
      return {
        id: feature.id,
        properties: feature.properties
      };
    });
  }
}
