import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import VarType from "../../Map/VarType";
import Feature from "../../Models/Feature";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./attribute-table.scss";
import DataGrid from "./DataGrid/DataGrid";
import AttributeFilter from "./FilterRenderers/AttributeFilter";
import NumericFilter from "./FilterRenderers/NumericFilter";
import EmptyRowsView from "./renderers/EmptyRowsView";
import rowRenderer from "./renderers/RowRenderer";
import zoomTool from "./tools/ZoomTool";

const rowsSort = {
  ASC: "ASC",
  DSC: "DSC",
  NONE: "NONE"
};

export const AttributeTable = createReactClass({
  displayName: "AttributeTable",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    catalogItem: PropTypes.object.isRequired,
    attributeTable: PropTypes.object.isRequired,
    selectedFeatureId: PropTypes.string
  },
  getInitialState() {
    const defaultColumnProperties = {
      editable: false,
      sortable: true,
      resizable: true,
      filterable: true,
      width: 150
    };

    const columns = this.props.attributeTable.columns.map(c => ({
      ...c,
      ...defaultColumnProperties,
      filterRenderer: this.defineFilterRenderer(c.name, c.type)
    }));
    columns.unshift(
      zoomTool(this.props.catalogItem.dataSource, this.props.terria)
    );
    const initialRows = this.props.attributeTable.items;
    let selectedNodes = [];
    if (
      defined(this.props.selectedFeatureId) &&
      defined(this.props.terria.selectedFeature)
    ) {
      selectedNodes = [this.props.selectedFeatureId];
    } else {
      selectedNodes = [];
    }
    return {
      removeClockSubscription: undefined,
      showRawData: false,
      initialRows: initialRows,
      columns: columns,
      selectedNodes: selectedNodes,
      filters: {},
      filteredRows: initialRows,
      sortDirection: rowsSort.NONE,
      sortColumn: undefined
    };
  },

  getRow(rowIdx) {},

  defineFilterRenderer(name, type) {
    if (
      type === VarType.SCALAR ||
      type === VarType.LAT ||
      type === VarType.LON
    ) {
      return NumericFilter;
    } else if (type === VarType.TIME) {
      return AttributeFilter;
    } else {
      return AttributeFilter;
    }
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    // we check if dataset is applying polling and update attribute table if true
    if (
      defined(this.props.catalogItem.polling) &&
      this.props.catalogItem.polling.isPolling
    ) {
      this.props.attributeTable.updateTable();
    }
    setSubscriptions(this, this.props.catalogItem);
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(nextProps) {
    // If the feature changed (without an unmount/mount),
    // change the subscriptions that handle time-varying data.
    if (nextProps.catalogItem !== this.props.catalogItem) {
      removeSubscriptions(this);
      setSubscriptions(this, nextProps.catalogItem);
    }
  },

  componentWillUnmount() {
    removeSubscriptions(this);
    this.setState({});
  },

  getRows(rows, filters) {
    const filtered = rows.filter(r => {
      let include = true;
      for (const columnKey in filters) {
        if (filters.hasOwnProperty(columnKey)) {
          const colFilter = filters[columnKey];

          if (
            colFilter.filterValues &&
            typeof colFilter.filterValues === "function"
          ) {
            include =
              include && colFilter.filterValues(r, colFilter, columnKey);
          } else if (typeof colFilter.filterTerm === "string") {
            // default filter
            const rowValue = r[columnKey];
            if (rowValue !== undefined && rowValue !== null) {
              if (
                rowValue
                  .toString()
                  .toLowerCase()
                  .indexOf(colFilter.filterTerm.toLowerCase()) === -1
              ) {
                include = include && false;
              }
            } else {
              include = include && false;
            }
          }
        }
      }
      return Boolean(include);
    });
    return filtered;
  },

  onAddFilter(filter) {
    const newFilters = handleFilterChange(filter);
    this.setState({ filters: newFilters(this.state.filters) }, () => {
      this.setState({
        filteredRows: this.filterRows(this.state.initialRows)
      });
    });
  },

  onClearFilters() {
    this.setState({
      filters: {},
      filteredRows: this.state.initialRows
    });
  },

  checkRowsAvailability() {
    return this.state.filteredRows.filter(function(row) {
      return defined(row.availability)
        ? row.availability.contains(row.catalogItem.currentTime)
        : true;
    });
  },
  filterRows(rows) {
    return this.sortRows(
      this.getRows(rows, this.state.filters),
      this.state.sortColumn,
      this.state.sortDirection
    );
  },

  getEmptyRowsView: () => {
    return <EmptyRowsView />;
  },

  sortRows(initialRows, sortColumn, sortDirection) {
    if (sortDirection === rowsSort.NONE) {
      return initialRows;
    }
    const sortDirectionSign = sortDirection === rowsSort.ASC ? 1 : -1;
    const rowComparer = (a, b) => {
      return sortDirectionSign * comparer(a[sortColumn], b[sortColumn]);
    };
    return initialRows.slice().sort(rowComparer);
  },

  onRowClick(rows) {
    if (defined(rows[0].row)) {
      const terria = this.props.terria;
      const feature = this.props.catalogItem.dataSource.entities.getById(
        rows[0].row.guid
      );
      terria.selectedFeature = feature;
      this.onRowsSelected(rows);
    }
  },

  onRowsSelected(rows) {
    if (defined(rows[0].row)) {
      this.setState({ selectedNodes: rows.map(r => r.row._guid) });
    }
  },
  onRowsDeselected(rows) {
    const rowIndexes = rows.map(r => r.rowIdx);
    this.setState(state => ({
      selectedNodes: state.selectedNodes.filter(
        i => rowIndexes.indexOf(i) === -1
      )
    }));
  },

  render() {
    const tableRows = this.checkRowsAvailability();
    const rowGetter = i => {
      return tableRows[i];
    };
    return (
      <div className={Styles.tableWrap}>
        <DataGrid
          columns={this.state.columns}
          rowGetter={rowGetter}
          rowsCount={tableRows.length}
          minHeight={250}
          onGridSort={(sortColumn, sortDirection) =>
            this.setState(
              { sortColumn: sortColumn, sortDirection: sortDirection },
              () =>
                this.setState(state => ({
                  filteredRows: this.filterRows(
                    this.sortRows(state.initialRows, sortColumn, sortDirection)
                  )
                }))
            )
          }
          rowScrollTimeout={null}
          enableCellSelection={false}
          onRowClick={(rowId, row) =>
            this.onRowClick([{ row: row, rowIdx: rowId }])
          }
          rowSelection={{
            showCheckbox: false,
            enableShiftSelect: false,
            onRowsSelected: this.onRowsSelected,
            onRowsDeselected: this.onRowsDeselected,
            multiSelect: false,
            selectBy: {
              keys: { rowKey: "guid", values: this.state.selectedNodes }
            }
          }}
          rowRenderer={rowRenderer}
          showFilters
          onAddFilter={this.onAddFilter}
          onClearFilters={this.onClearFilters}
          emptyRowsView={this.getEmptyRowsView}
        />
      </div>
    );
  }
});

const handleFilterChange = filter => filters => {
  const newFilters = { ...filters };
  if (filter.filterTerm) {
    newFilters[filter.column.key] = filter;
  } else {
    delete newFilters[filter.column.key];
  }
  return newFilters;
};

const comparer = (a, b) => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

/**
 * Do we need to dynamically update this feature info over time?
 * There are three situations in which we would:
 * 1. When the feature description or properties are time-varying.
 * 2. When a custom component self-updates.
 * 3. When a catalog item changes a feature's properties, eg. changing from a daily view to a monthly view.
 *
 * For (1), use catalogItem.clock.currentTime knockout observable so don't need to do anything specific here.
 * For (2), use a regular javascript setTimeout to update a counter in feature's currentProperties.
 * For (3), use an event listener on the Feature's underlying Entity's "definitionChanged" event.
 *   Conceivably it could also be handled by the catalog item itself changing, if its change is knockout tracked, and the
 *   change leads to a change in what is rendered (unlikely).
 * Since the catalogItem is also a prop, this will trigger a rerender.
 * @private
 */
function setSubscriptions(attributeTable, catalogItem) {
  if (defined(catalogItem.dataSource)) {
    attributeTable.setState({
      removeSubsciption: catalogItem.dataSource.entities.collectionChanged.addEventListener(
        updateAttributeTable,
        attributeTable
      )
    });
  } else if (defined(catalogItem.regionMapping)) {
    /* this.setState({
      removeSubsciption: catalogItem.dataSource.entities.collectionChanged.addEventListener(
        updateAttributeTable,
        attributeTable
      )
    }); */
  }
  attributeTable.setState({
    selectedFeatureSubscription: knockout
      .getObservable(attributeTable.props.terria, "selectedFeature")
      .subscribe(function(selectedFeature) {
        if (
          defined(selectedFeature) &&
          (defined(selectedFeature.properties) ||
            defined(selectedFeature.description))
        ) {
          attributeTable.setState({
            selectedNodes: [selectedFeature.id]
          });
        } else {
          attributeTable.setState({
            selectedNodes: []
          });
        }
      })
  });
}

function updateAttributeTable(collection, added, removed, changed) {
  this.props.attributeTable.updateTable();
  const initialRows = this.props.attributeTable.items;
  this.setState({
    initialRows: initialRows,
    filteredRows: this.getRows(initialRows, this.state.filters)
  });
}
/**
 * Remove the clock subscription (event listener) and timeouts.
 * @private
 */
function removeSubscriptions(attributeTable) {
  if (defined(attributeTable.state.removeSubsciption)) {
    attributeTable.state.removeSubsciption();
    attributeTable.setState({
      removeSubsciption: undefined
    });
  }
  if (defined(attributeTable.state.selectedFeatureSubscription)) {
    attributeTable.state.selectedFeatureSubscription.dispose();
    attributeTable.setState({
      selectedFeatureSubscription: undefined
    });
  }
}

export default AttributeTable;
