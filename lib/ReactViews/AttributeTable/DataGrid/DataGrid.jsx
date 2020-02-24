import PropTypes from "prop-types";
import Grid from "react-data-grid";

class DataGrid extends Grid {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.showFilters) {
      this.onToggleFilter();
    }
  }

  componentDidUpdate(oldProps) {
    const { displayFilters } = this.props;
    if (oldProps.displayFilters !== displayFilters) {
      this.onToggleFilter();
    }
  }

  componentWillUnmount() {
    if (this.props.displayFilters) {
      this.onToggleFilter();
    }
  }
}

DataGrid.displayName = "DataGrid";
DataGrid.propTypes = {
  showFilters: PropTypes.bool
};

module.exports = DataGrid;
