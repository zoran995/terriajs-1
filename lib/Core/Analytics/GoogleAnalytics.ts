/*global gtag*/

import i18next from "i18next";
import isDefined from "../isDefined";
import { Category } from "./analyticEvents";
import { BaseAnalytics, IBaseAnalyticsParams } from "./BaseAnalytics";

declare global {
  interface Window {
    dataLayer: any;
  }
}

export interface IGoogleAnalyticsParams extends IBaseAnalyticsParams {
  key: "google";
  /**
   * A Google API key for [Google Analytics](https://analytics.google.com).  If specified, TerriaJS will send various events about how it's used to Google Analytics.
   */
  googleAnalyticsKey: any;
  googleAnalyticsOptions?: any;
}

export class GoogleAnalytics extends BaseAnalytics {
  private key?: string;
  private options: any;
  constructor(
    userParameters: IGoogleAnalyticsParams = {
      key: "google",
      googleAnalyticsKey: undefined,
      consentRequired: true
    }
  ) {
    super({ key: "google", consentRequired: userParameters.consentRequired });
    this.key = userParameters.googleAnalyticsKey;
    this.options = userParameters.googleAnalyticsOptions;
    this.initializeGoogleAnalytics();

    if (process.env.NODE_ENV === "development") {
      console.log(
        "Google Analytics was initialised in a `development` environment"
      );
    }
  }

  logEvent(
    category: Category,
    action: import("./analyticEvents").Actions,
    label: string,
    value?: string
  ): void {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }

  initializeGoogleAnalytics() {
    if (isDefined(window.gtag)) {
      return;
    }

    if (!isDefined(this.key)) {
      console.log(i18next.t("core.googleAnalytics.log"));
      window.gtag = function() {};
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = () => {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.key}`;
    script.async = true;
    document.body.appendChild(script);

    gtag("consent", "default", {
      ad_storage: "denied",
      analytics_storage: this.consentRequired ? "denied" : "granted"
    });

    gtag("set", "ads_data_redaction", true);

    gtag("js", new Date());

    gtag("config", "GA_MEASUREMENT_ID", {
      send_page_view: false,
      anonymize_ip: true
    });
  }

  grantConsent() {
    gtag("consent", "update", {
      analytics_storage: "granted"
    });
  }

  revokeConsent() {
    gtag("consent", "update", {
      analytics_storage: "denied"
    });
  }
}
