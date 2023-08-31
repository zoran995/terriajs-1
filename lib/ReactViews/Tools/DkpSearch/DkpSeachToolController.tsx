import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../Styled/Icon";
import { ToolButtonController } from "../Tool";
import DkpSearch, { DKP_SEARCH_ID } from "./DkpSearch";
import Terria from "../../../Models/Terria";
import i18next from "i18next";
import TerriaError from "../../../Core/TerriaError";

export class DkpSearchToolController extends ToolButtonController {
  private readonly terria: Terria;

  constructor(private readonly viewState: ViewState) {
    super({
      toolName: DKP_SEARCH_ID,
      viewState: viewState,
      getToolComponent: () => DkpSearch as any,
      icon: GLYPHS.parcela
    });
    this.pinned = false;
    this.terria = viewState.terria;
  }

  activate() {
    if (!this.terria.parcelSearchAllowed) {
      this.terria.raiseErrorToUser(
        new TerriaError({
          sender: this,
          title: i18next.t("dkpSearch.access.title"),
          message: i18next.t("dkpSearch.access.message", {
            email:
              '<a href="mailto:' +
              this.terria.supportEmail +
              '">' +
              this.terria.supportEmail +
              "</a>"
          })
        })
      );
      return;
    }
    super.activate();
  }
}
