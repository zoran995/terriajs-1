import { makeObservable, reaction } from "mobx";
import { GLYPHS } from "../../Styled/Icon";
import { GenericMapNavigationItemController } from "./../../ViewModels/MapNavigation/MapNavigationItemController";
import HistoryControls from "./HistoryControls";

export class HistoryControlsControllerForward extends GenericMapNavigationItemController {
  constructor(historyControls: HistoryControls) {
    super({
      handleClick: () => {
        historyControls.goForward();
      },
      icon: GLYPHS.arrowForward
    });

    makeObservable(this);

    this.disabled = historyControls.forwardDisabled;

    reaction(
      () => historyControls.forwardDisabled,
      () => (this.disabled = historyControls.forwardDisabled)
    );
  }
}

export class HistoryControlsControllerBack extends GenericMapNavigationItemController {
  constructor(historyControls: HistoryControls) {
    super({
      handleClick: () => {
        historyControls.goBack();
      },
      icon: GLYPHS.arrowBack
    });
    makeObservable(this);

    this.disabled = historyControls.backDisabled;

    reaction(
      () => historyControls.backDisabled,
      () => (this.disabled = historyControls.backDisabled)
    );
  }
}
