import TerriaError from "./TerriaError";
import Terria from "./../Models/Terria";
import i18next from "i18next";
import CatalogMemberMixin from "../ModelMixins/CatalogMemberMixin";

export function checkIfAccessAllowed(
  item: CatalogMemberMixin.Instance,
  terria: Terria
) {
  if (item.isPrivate && terria.userInfo === undefined) {
    terria.raiseErrorToUser(
      new TerriaError({
        sender: item,
        overrideRaiseToUser: true,
        title: i18next.t("models.raiseError.privateDataErrorTitle"),
        message: i18next.t("models.raiseError.privateDataErrorMessage", {
          name: item.nameInCatalog || item.name,
          email:
            '<a href="mailto:' +
            terria.supportEmail +
            '">' +
            terria.supportEmail +
            "</a>"
        })
      }),
      undefined,
      true
    );

    return false;
  }

  return true;
}
