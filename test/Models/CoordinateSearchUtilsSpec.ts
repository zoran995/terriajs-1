import Terria from "../../lib/Models/Terria";
import CoordinateSearchUtils from "./../../lib/Models/CoordinateSearchUtils";

describe("CoordinateSearchUtils", function () {
  let terria: Terria;
  let coordinateSearch: CoordinateSearchUtils;

  beforeEach(function () {
    terria = new Terria();
    const options = { terria: terria };
    coordinateSearch = new CoordinateSearchUtils(options);
  });

  it("properly start search", function () {
    coordinateSearch.startSearch();
    expect(terria.overlays.items.length).toBe(1);
    expect(coordinateSearch.mapItems.length).toBe(1);
    expect(coordinateSearch.mapItems[0].entities.values.length).toBe(0);
  });

  it("properly cleans up", function () {
    coordinateSearch.startSearch();
    expect(terria.overlays.items.length).toBe(1);
    coordinateSearch.cleanUp();
    expect(terria.overlays.items.length).toBe(0);
  });

  it("properly handles adding of new markers", function () {
    coordinateSearch.startSearch();
    coordinateSearch.addMarker({
      name: "test",
      location: { latitude: 0, longitude: 0 }
    });
    expect(terria.overlays.items.length).toBe(1);
    expect(coordinateSearch.mapItems.length).toBe(1);
    expect(coordinateSearch.mapItems[0].entities.values.length).toBe(1);
    coordinateSearch.addMarker({
      name: "test",
      location: { latitude: 20, longitude: 10 }
    });
    expect(coordinateSearch.mapItems[0].entities.values.length).toBe(1);
  });
});
