import {
  action,
  IReactionDisposer,
  makeObservable,
  reaction,
  runInAction
} from "mobx";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import Model from "../Models/Definition/Model";
import { GeoShopHighlightItem } from "../Models/GeoShop/GeoshopHighlightItem";
import MapInteractionMode from "../Models/MapInteractionMode";
import { determineCatalogItem } from "../ReactViews/FeatureInfo/FeatureInfoPanel";
import GeoShopItemTraits from "../Traits/TraitsClasses/GeoShopItemTraits";
import { toFeatureCollection } from "./GeojsonMixin";

function GeoShopMixin<T extends Constructor<Model<GeoShopItemTraits>>>(
  Base: T
) {
  abstract class GeoshopMixin extends Base {
    public highlightItem: GeoShopHighlightItem | undefined;
    private _geoshopPickListenerDisposer: IReactionDisposer | undefined;
    private _pickPointMode?: MapInteractionMode;

    get hasGeoShopMixin() {
      return true && this.isGeoShopItem;
    }

    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
    }

    @action
    initializeBuy() {
      this.highlightItem = this.createHighlightItem();
      this.terria.overlays.add(this.highlightItem);

      const pickPointMode =
        this._pickPointMode ??
        new MapInteractionMode({
          message: "",
          render: false
        });

      this.addInteractionModeToMap(pickPointMode);

      this._geoshopPickListenerDisposer = reaction(
        () => pickPointMode.pickedFeatures,
        async (pickedFeatures) => {
          if (pickedFeatures === undefined) {
            this.terria.pickedFeatures = pickedFeatures;
            return;
          }

          if (isDefined(pickedFeatures.allFeaturesAvailablePromise)) {
            await pickedFeatures.allFeaturesAvailablePromise;
          }

          if (isDefined(pickedFeatures.features)) {
            const features = [...pickedFeatures.features];
            for (let i = features.length - 1; i >= 0; i--) {
              const feature = features[i];

              const catalogItem = determineCatalogItem(
                this.terria.workbench,
                feature
              );
              const highlightItem = this.highlightItem;
              if (catalogItem === highlightItem) {
                pickedFeatures.features.splice(i, 1);
              }

              // @ts-expect-error:
              if (catalogItem !== this || !(feature?.data as any)?.geometry) {
                continue;
              }

              const geoJson = toFeatureCollection(feature.data);

              if (geoJson) highlightItem?.addEntities(geoJson);
            }
          }
          runInAction(() => {
            this.terria.pickedFeatures = pickedFeatures;
          });
        }
      );

      this._pickPointMode = pickPointMode;
      this.terria.geoshopCatalogItem = this;
    }

    stopSelection() {
      this._geoshopPickListenerDisposer?.();
      if (this._pickPointMode) {
        this.removeInteractionModeFromMap(this._pickPointMode);
      }
      if (this.highlightItem) {
        this.terria.overlays.remove(this.highlightItem);
      }
    }

    onRemoveFromWorkbench() {
      this.stopSelection();
      this.highlightItem?.clean();
    }

    private addInteractionModeToMap(pickPointMode: MapInteractionMode) {
      this.removeInteractionModeFromMap(pickPointMode);
      runInAction(() => {
        this.terria.mapInteractionModeStack.push(pickPointMode);
      });
    }

    private removeInteractionModeFromMap(pickPointMode: MapInteractionMode) {
      for (let i = this.terria.mapInteractionModeStack.length; i >= 0; i--) {
        const mode = this.terria.mapInteractionModeStack[i - 1];
        if (mode === pickPointMode) {
          runInAction(() => {
            this.terria.mapInteractionModeStack.splice(i - 1, 1);
          });
          break;
        }
      }
    }

    private createHighlightItem(): GeoShopHighlightItem {
      const id = `${this.uniqueId}-geoshop-${this.productId}`;
      const name = `GeoShop ${this.name}`;

      const catalogItem =
        this.highlightItem ??
        new GeoShopHighlightItem(id, this.terria, name, this);

      return catalogItem;
    }
  }

  return GeoshopMixin;
}

namespace GeoShopMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof GeoShopMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasGeoShopMixin;
  }
}

export default GeoShopMixin;
