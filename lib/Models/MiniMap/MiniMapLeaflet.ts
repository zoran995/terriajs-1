import Leaflet from "../Leaflet";
import MiniMapViewer from "./MiniMapViewer";

export default class MiniMapLeaflet extends Leaflet {
  constructor(
    readonly miniMapViewer: MiniMapViewer,
    readonly container: string | HTMLElement
  ) {
    super(miniMapViewer, container);
    this._selectionIndicator.removeFromMap();
  }
}
