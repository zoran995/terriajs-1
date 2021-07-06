import {
  computed,
  IReactionDisposer,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction
} from "mobx";
import { now } from "mobx-utils";
import Constructor from "../Core/Constructor";
import Model from "../Models/Model";
import AutoRefreshingTraits from "../Traits/AutoRefreshingTraits";
import MappableMixin from "./MappableMixin";

type AutoRefreshing = Model<AutoRefreshingTraits>;

function AutoRefreshingMixin<T extends Constructor<AutoRefreshing>>(Base: T) {
  abstract class AutoRefreshingMixin extends MappableMixin(Base) {
    private autoRefreshDisposer: IReactionDisposer | undefined;
    private autorunRefreshEnableDisposer: IReactionDisposer | undefined;

    get hasAutoRefreshingMixin() {
      return true;
    }

    /** Return the interval in seconds to poll for updates. */
    abstract get refreshInterval(): number | undefined;

    /** Call hook for refreshing the item */
    abstract refreshData(): void;

    constructor(...args: any[]) {
      super(...args);
      // We should only poll when our map items have consumers
      onBecomeObserved(this, "mapItems", this.startAutoRefresh.bind(this));
      onBecomeUnobserved(this, "mapItems", this.stopAutoRefresh.bind(this));
    }

    private startAutoRefresh() {
      if (!this.autorunRefreshEnableDisposer) {
        // Toggle autorefresh when `refreshEnabled` trait changes
        this.autorunRefreshEnableDisposer = reaction(
          () => this.refreshEnabled,
          () => {
            if (this.refreshEnabled) {
              this.startAutoRefresh();
            } else {
              this.stopAutoRefresh();
            }
          }
        );
      }
      if (!this.autoRefreshDisposer && this.refreshEnabled) {
        this.autoRefreshDisposer = reaction(
          () => this._pollingTimer,
          () => {
            if (this.show) this.refreshData();
          }
        );
      }
    }

    private stopAutoRefresh() {
      if (this.autorunRefreshEnableDisposer) {
        this.autorunRefreshEnableDisposer();
        this.autorunRefreshEnableDisposer = undefined;
      }
      if (this.autoRefreshDisposer) {
        this.autoRefreshDisposer();
        this.autoRefreshDisposer = undefined;
      }
    }

    @computed
    private get _pollingTimer(): number | undefined {
      if (this.refreshInterval !== undefined) {
        return now(this.refreshInterval * 1000);
      } else {
        return undefined;
      }
    }

    @computed
    get isPolling() {
      return this._pollingTimer !== undefined;
    }

    @computed
    get nextScheduledUpdateTime(): Date | undefined {
      if (
        this.refreshEnabled &&
        this._pollingTimer !== undefined &&
        this.refreshInterval !== undefined
      ) {
        return new Date(this._pollingTimer + this.refreshInterval * 1000);
      } else {
        return undefined;
      }
    }
  }

  return AutoRefreshingMixin;
}

namespace AutoRefreshingMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof AutoRefreshingMixin>> {}

  export function isMixedInto(model: any): model is Instance {
    return model && model.hasAutoRefreshingMixin;
  }
}

export default AutoRefreshingMixin;
