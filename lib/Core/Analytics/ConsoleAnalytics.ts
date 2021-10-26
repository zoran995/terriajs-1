import i18next from "i18next";
import isDefined from "../isDefined";
import { Category, Actions } from "./analyticEvents";
import { BaseAnalytics, IBaseAnalyticsParams } from "./BaseAnalytics";

export interface IConsoleAnalyticsParams extends IBaseAnalyticsParams {
  key: "console";
  logToConsole: boolean;
}

export class ConsoleAnalytics extends BaseAnalytics {
  private logToConsole: boolean = false;

  constructor(
    userParameters: IConsoleAnalyticsParams = {
      key: "console",
      logToConsole: true
    }
  ) {
    super({
      key: userParameters.key,
      consentRequired: userParameters.consentRequired ?? false
    });
    if (isDefined(userParameters.logToConsole) && userParameters.logToConsole) {
      console.log("ConsoleAnalytics was started");
      this.logToConsole = userParameters.logToConsole;
    } else {
      console.log(
        "ConsoleAnalytics was started, however `userParameters.logToConsole` was not defined or set to false."
      );
    }
  }

  logEvent(
    category: Category,
    action: Actions,
    label: string,
    value?: string
  ): void {
    if (this.logToConsole) {
      var labelString = isDefined(label) ? " Label: " + label : "";
      var valueString = isDefined(value) ? " Value: " + value : "";
      console.log(
        `** Event ** Category: ${category},  Action: ${action}, ${labelString} ${valueString}`
      );
    }
  }
  grantConsent(): void {}
  revokeConsent(): void {}
}
