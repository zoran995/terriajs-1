import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import primitiveArrayTrait from "../Decorators/primitiveArrayTrait";

export default class GeoShopItemTraits extends mixTraits(CatalogMemberTraits) {
  @primitiveTrait({
    type: "boolean",
    name: "Is geoshop item",
    description: "Is this item a geoshop item."
  })
  isGeoShopItem: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Is geoshop selection available",
    description: "Is geoshop selection available for this item."
  })
  isGeoShopSelectionAvailable: boolean = false;

  @primitiveTrait({
    type: "number",
    name: "Product id",
    description: "The geoshop product id."
  })
  productId!: number;

  @primitiveArrayTrait({
    type: "number",
    name: "Product format id",
    description: "The geoshop product format id."
  })
  productFormatIds!: number[];

  @primitiveArrayTrait({
    type: "string",
    name: "Data unique identifier",
    description:
      "Unique identifiers of selected items for the product. Will be sent to server to complete delivery process."
  })
  dataUniqueIdentifiers?: string[];

  @primitiveArrayTrait({
    type: "string",
    name: "Data unique identifier",
    description:
      "Unique identifiers of selected items for the product. Will be sent to server to complete delivery process."
  })
  extraProperties?: string[];

  @primitiveTrait({
    type: "boolean",
    name: "Use item id",
    description:
      "Whether the id returned in feature info response should be used as unique identifier."
  })
  shouldUseItemId: boolean = true;
}
