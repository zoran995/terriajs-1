import { ConsoleAnalytics, IConsoleAnalyticsParams } from "./ConsoleAnalytics";
import { GoogleAnalytics, IGoogleAnalyticsParams } from "./GoogleAnalytics";

export type IAnalyticsParams =
  | IGoogleAnalyticsParams
  | IConsoleAnalyticsParams
  | undefined;

export function setAnalytics(analyticsParams: IAnalyticsParams) {
  if (typeof window !== "undefined" && analyticsParams?.key === "google") {
    return new GoogleAnalytics(analyticsParams);
  } else if (analyticsParams?.key === "console") {
    return new ConsoleAnalytics(analyticsParams);
  }
}
