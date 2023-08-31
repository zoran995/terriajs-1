import ModelTraits from "../ModelTraits";
import mixTraits from "../mixTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";

export default class UserDrawingTraits extends mixTraits(
  ModelTraits,
  CatalogMemberTraits
) {}
