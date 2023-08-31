import {
  computed,
  IComputedValue,
  makeObservable,
  observable,
  override
} from "mobx";
import { fromPromise, FULFILLED, IPromiseBasedObservable } from "mobx-utils";
import MappableMixin from "../../ModelMixins/MappableMixin";
import TerriaViewer from "../../ViewModels/TerriaViewer";
import NoViewer from "../NoViewer";
import Terria from "../Terria";
import ViewerMode from "../ViewerMode";
import GlobeOrMap from "../GlobeOrMap";

const leafletMiniMapFromPromise = computed(
  () =>
    fromPromise(
      import("./MiniMapLeaflet").then(
        (MiniMapLeaflet) => MiniMapLeaflet.default
      )
    ),
  { keepAlive: true }
);

export default class MiniMapViewer extends TerriaViewer {
  constructor(
    readonly terria: Terria,
    readonly items: IComputedValue<MappableMixin.Instance[]>
  ) {
    super(terria, items);
  }

  @override
  get _currentViewerConstructorPromise(): IPromiseBasedObservable<
    new (
      terriaViewer: TerriaViewer,
      container: string | HTMLElement
    ) => GlobeOrMap
  > {
    let viewerFromPromise: IPromiseBasedObservable<
      new (
        terriaViewer: TerriaViewer,
        container: string | HTMLElement
      ) => GlobeOrMap
    > = fromPromise.resolve(NoViewer) as IPromiseBasedObservable<
      typeof NoViewer
    >;

    if (this.attached && this.viewerMode === ViewerMode.Leaflet) {
      viewerFromPromise = leafletMiniMapFromPromise.get();
    }

    return viewerFromPromise;
  }
}
