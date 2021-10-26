import { Actions, Category } from "./analyticEvents";

export interface IBaseAnalyticsParams {
  key: string;
  consentRequired?: boolean;
}

export abstract class BaseAnalytics {
  protected readonly consentRequired: boolean;
  consentGranted: boolean = false;
  constructor(userParameters: IBaseAnalyticsParams) {
    this.consentRequired = userParameters.consentRequired ?? true;
  }

  //abstract start(userParameters: Record<string, any>): void;

  abstract logEvent(
    category: Category,
    action: Actions,
    label?: string,
    value?: string
  ): void;

  abstract grantConsent(): void;
  abstract revokeConsent(): void;
}
