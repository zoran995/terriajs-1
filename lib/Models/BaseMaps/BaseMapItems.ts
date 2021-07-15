import { computed, observable, runInAction } from "mobx";
import { BaseMapViewModel } from "./../../ViewModels/BaseMapViewModel";
import { BaseMapModel } from "./BaseMapModel";
import Terria from "../Terria";
import TerriaError from "../../Core/TerriaError";
import BingMapsCatalogItem from "../BingMapsCatalogItem";
import upsertModelFromJson from "../upsertModelFromJson";
import CommonStrata from "../CommonStrata";
import MappableMixin from "../../ModelMixins/MappableMixin";
import Result from "../../Core/Result";
import { defaultBaseMaps } from "./defaultBaseMaps";
import CatalogMemberFactory from "../CatalogMemberFactory";
import isDefined from "../../Core/isDefined";
import { BaseModel } from "../Model";

export class BaseMapItems {
  private readonly _items = observable.array<BaseMapViewModel>();
  private readonly _defaultBaseMaps: BaseMapModel[] = [];
  private readonly _useItems = observable.array<BaseMapViewModel>();

  constructor(private readonly terria: Terria) {}

  /**
   * Gets the list of available basemap items.
   */
  @computed
  private get items(): readonly BaseMapViewModel[] {
    return this._items;
  }

  /**
   * List of the basemaps to show in setting panel
   */
  @computed
  get useItems(): readonly BaseMapViewModel[] {
    return this._useItems;
  }

  /**
   * Define the list of basemap items to show in the setting panel
   * @param itemIds
   */
  setItemsToUse(itemIds: readonly string[]) {
    if (itemIds.length > 0) {
      const baseMaps: BaseMapViewModel[] = [];
      // doing this to sort the same way as provided list of basemap ids
      for (const id of itemIds) {
        const baseMap = this.items.find(item => item.mappable.uniqueId === id);
        if (baseMap) {
          baseMaps.push(baseMap);
        }
      }

      this._useItems.spliceWithArray(
        0,
        this._useItems.length,
        baseMaps.slice()
      );
    }
    // list is empty, add all basemaps as fallback
    if (this._useItems.length === 0) {
      this._useItems.spliceWithArray(
        0,
        this._useItems.length,
        this.items.slice()
      );
    }
  }

  /**
   * Can't do this in constructor since {@link CatalogMemberFactory} doesn't have any values at the moment of
   * initializing Terria class.
   */
  initializeDefaultBaseMaps() {
    if (this._defaultBaseMaps.length === 0 && this._items.length === 0) {
      this._defaultBaseMaps.push(...defaultBaseMaps(this.terria));
      this.addFromJson(
        this._defaultBaseMaps,
        this.terria,
        CommonStrata.underride
      );
    }
  }

  addFromJson(
    newBaseMaps: BaseMapModel[],
    terria: Terria,
    stratumName: CommonStrata = CommonStrata.definition
  ) {
    const errors: TerriaError[] = [];
    if (!Array.isArray(newBaseMaps)) {
      return Result.error({
        title: "Invalid basemaps definition",
        message: `Property basemaps is expected to be an array but instead it is of type ${typeof newBaseMaps}.`
      });
    }

    const models = newBaseMaps
      .map(newBaseMap => {
        const item = newBaseMap.item;
        if (!item) {
          console.log("basemap is missing the item property.");
          return;
        }
        const exists = this.items.some(
          baseMapItem =>
            baseMapItem.mappable.uniqueId === (<any>newBaseMap.item).id
        );

        if (item.type === BingMapsCatalogItem.type) {
          addBingMapsKey(item, terria);
        }
        const model = upsertModelFromJson(
          CatalogMemberFactory,
          terria,
          "/basemap/",
          stratumName,
          newBaseMap.item,
          {
            addModelToTerria: true
          }
        ).catchError(error => errors.push(error));
        if (!exists && MappableMixin.isMixedInto(model)) {
          const baseMapModel = new BaseMapViewModel(model, newBaseMap.image);
          runInAction(() => this._items.push(baseMapModel));
          return baseMapModel;
        }
      })
      .filter(isDefined);

    return new Result(
      models,
      TerriaError.combine(errors, {
        message: {
          key: "models.terria.loadingBaseMapsErrorTitle"
        }
      })
    );
  }
}

function addBingMapsKey(item: any, terria: Terria) {
  if (!item.key) {
    item.key = terria.configParameters.bingMapsKey;
  }
}
