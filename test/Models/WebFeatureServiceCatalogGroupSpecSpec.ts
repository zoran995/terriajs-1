import WebFeatureServiceCatalogGroup from "../../lib/Models/Catalog/Ows/WebFeatureServiceCatalogGroup";
import Terria from "../../lib/Models/Terria";
import { autorun, runInAction } from "mobx";
import i18next from "i18next";

describe("WebFeatureServiceCatalogGroup", function () {
  let terria: Terria;
  let wfs: WebFeatureServiceCatalogGroup;

  beforeEach(function () {
    terria = new Terria();
    wfs = new WebFeatureServiceCatalogGroup("test", terria);
  });

  it("has a type", function () {
    expect(wfs.type).toBe("wfs-group");
  });

  it("derives getCapabilitiesUrl from url if getCapabilitiesUrl is not specified", function () {
    wfs.setTrait("definition", "url", "http://www.example.com");
    expect(wfs.getCapabilitiesUrl).toBeDefined();
    expect(wfs.url).toBeDefined();
    expect(
      wfs.getCapabilitiesUrl &&
        wfs.getCapabilitiesUrl.indexOf(wfs.url || "undefined") === 0
    ).toBe(true);
  });

  describe("after loading capabilities", function () {
    beforeEach(async function () {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/single_metadata_url.xml");
      });
    });

    it("defines name", async function () {
      await wfs.loadMetadata();
      expect(wfs.name).toBe("wfs Server");
    });

    it("doesn't override user set name", async function () {
      const userDefinedName = "user defined name";
      runInAction(() => {
        wfs.setTrait("definition", "name", userDefinedName);
      });
      await wfs.loadMetadata();
      expect(wfs.name).toBe(userDefinedName);
    });

    it("defines info", async function () {
      await wfs.loadMetadata();
      const abstract = i18next.t(
        "models.webFeatureServiceCatalogGroup.abstract"
      );
      const accessConstraints = i18next.t(
        "models.webFeatureServiceCatalogGroup.accessConstraints"
      );
      const fees = i18next.t("models.webFeatureServiceCatalogGroup.fees");
      console.log(wfs.info);
      expect(wfs.info.map(({ name }) => name)).toEqual([
        abstract,
        accessConstraints,
        fees
      ]);

      expect(wfs.info.map(({ content }) => content)).toEqual([
        "web feature service foo bar test",
        "test",
        "test"
      ]);
    });
  });

  describe("loadMembers", function () {
    beforeEach(async function () {
      runInAction(() => {
        wfs.setTrait("definition", "url", "test/WFS/single_metadata_url.xml");
      });
      await wfs.loadMembers();
    });

    it("loads", async function () {
      expect(wfs.members.length).toEqual(1);
      expect(wfs.memberModels.length).toEqual(1);
      console.log(wfs.members);
    });
  });
});
