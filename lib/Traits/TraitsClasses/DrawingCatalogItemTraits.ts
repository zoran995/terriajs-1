import objectArrayTrait from "../Decorators/objectArrayTrait";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import ExportableTraits from "./ExportableTraits";
import FeatureInfoTraits from "./FeatureInfoTraits";
import LegendTraits from "./LegendTraits";
import MappableTraits from "./MappableTraits";

export default class DrawingCatalogItemTraits extends mixTraits(
  FeatureInfoTraits,
  MappableTraits,
  CatalogMemberTraits,
  ExportableTraits
) {
  @objectArrayTrait({
    name: "Legend URLs",
    description: "The legends to display on the workbench.",
    type: LegendTraits,
    idProperty: "index"
  })
  legends?: LegendTraits[];
}
