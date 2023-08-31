import ViewState from "./../../../lib/ReactViewModels/ViewState";
import Terria from "./../../../lib/Models/Terria";
import { act, Simulate } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import AttributeTablePanel from "../../../lib/ReactViews/AttributeTable/AttributeTablePanel";
import React from "react";
import { NoData } from "../../../lib/ReactViews/AttributeTable/NoData";
import GeoJsonCatalogItem from "../../../lib/Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import { runInAction } from "mobx";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import loadText from "../../../lib/Core/loadText";
import { Table } from "../../../lib/ReactViews/AttributeTable/Table";
import {
  HeaderRowElement,
  HeaderCell,
  TableBody,
  TableRow,
  TableCell,
  CellContent,
  HeaderCellContent,
  FilterCell
} from "../../../lib/ReactViews/AttributeTable/TableStyles";
import { createWithContexts } from "../withContext";

describe("AttributeTablePanel", async function () {
  let terria: Terria;
  let viewState: ViewState;

  let testRenderer: any;
  let item: GeoJsonCatalogItem;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });

    item = new GeoJsonCatalogItem("test", terria);
  });

  it("properly renders no data when no source item", function () {
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <AttributeTablePanel />
        </ThemeProvider>
      );
    });
    const instances = testRenderer.root.findAllByType(NoData);
    const noDataInstances = testRenderer.root.findAllByType(NoData);
    expect(noDataInstances.length).toBe(1);
  });

  it("properly renders when data is empty", function () {
    act(() => {
      testRenderer = createWithContexts(
        viewState,
        <ThemeProvider theme={terriaTheme}>
          <AttributeTablePanel sourceItem={item} />
        </ThemeProvider>
      );
    });
    const instances = testRenderer.root.findAllByType(NoData);
    expect(instances.length).toBe(1);
  });

  describe("with loaded item", function () {
    beforeEach(async function () {
      await loadText("test/GeoJSON/table.geojson").then(async function (
        s: string
      ) {
        runInAction(() => {
          item.setTrait(CommonStrata.definition, "geoJsonString", s);
        });
        await item.loadMapItems();
      });
      act(() => {
        testRenderer = createWithContexts(
          viewState,
          <ThemeProvider theme={terriaTheme}>
            <AttributeTablePanel sourceItem={item} />
          </ThemeProvider>
        );
      });
    });

    it("render 1 table component", function () {
      const tableInstances = testRenderer.root.findAllByType(Table);
      expect(tableInstances.length).toBe(1);
    });

    it("render 1 header row", function () {
      const headerRowInstances =
        testRenderer.root.findAllByType(HeaderRowElement);
      expect(headerRowInstances.length).toBe(1);
    });

    it("render header cells", function () {
      const headerCellInstances = testRenderer.root.findAllByType(HeaderCell);
      expect(headerCellInstances.length).toBe(5 + 1);
    });

    it("render header cells content", function () {
      const headerCellContentInstances =
        testRenderer.root.findAllByType(HeaderCellContent);
      expect(headerCellContentInstances.length).toBe(5 + 1);
    });

    it("render table body", function () {
      const tableBodyInstance = testRenderer.root.findAllByType(TableBody);
      expect(tableBodyInstance.length).toBe(1);
    });

    /* it("render table rows", function() {
      const tableRowInstance = testRenderer.root.findAllByType(TableRow);
      expect(tableRowInstance.length).toBe(4);
    });

    it("render table cells", function() {
      const tableCellInstance = testRenderer.root.findAllByType(TableCell);
      expect(tableCellInstance.length).toBe((4 + 1) * 4);
    });

    it("render cell content", function() {
      const cellContentInstance = testRenderer.root.findAllByType(CellContent);
      expect(cellContentInstance.length).toBe(4 * 4 + 5);
    }); */
  });
});
