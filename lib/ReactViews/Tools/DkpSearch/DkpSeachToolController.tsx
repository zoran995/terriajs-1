import ViewState from "../../../ReactViewModels/ViewState";
import { GLYPHS } from "../../../Styled/Icon";
import { ToolButtonController } from "../Tool";
import DkpSearch, { DKP_SEARCH_ID } from "./DkpSearch";

export class DkpSearchToolController extends ToolButtonController {
  constructor(private readonly viewState: ViewState) {
    super({
      toolName: DKP_SEARCH_ID,
      viewState: viewState,
      getToolComponent: () => DkpSearch as any,
      icon: GLYPHS.parcela
    });
    this.pinned = false;
  }
}
