import i18next from "i18next";
import { action, reaction, runInAction } from "mobx";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { addMarker, removeMarker } from "../../Models/LocationMarkerUtils";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
// import SidebarSearch from "../Search/SidebarSearch";
import LocationSearchResults from "../Search/LocationSearchResults";
// import { ThemeContext } from "styled-components";
import SearchBox from "../Search/SearchBox";

export function SearchInDataCatalog({ viewState, handleClick }) {
  const locationSearchText = viewState.searchState.locationSearchText;
  return (
    <RawButton
      fullWidth
      onClick={() => {
        const { searchState } = viewState;
        // Set text here as a separate action so that it doesn't get batched up and the catalog
        // search text has a chance to set isWaitingToStartCatalogSearch
        searchState.setCatalogSearchText(searchState.locationSearchText);

        viewState.searchInCatalog(searchState.locationSearchText);
        handleClick && handleClick();
      }}
    >
      <Box paddedRatio={2} rounded charcoalGreyBg>
        <StyledIcon styledWidth={"14px"} glyph={GLYPHS["dataCatalog"]} />
        <Spacing right={2} />
        <Text textAlignLeft textLight large fullWidth>
          <Trans
            i18nKey="search.searchInDataCatalog"
            values={{ locationSearchText }}
          >
            Search <strong>{locationSearchText}</strong> in the Data Catalogue
          </Trans>
        </Text>
        <StyledIcon glyph={GLYPHS.right2} styledWidth={"14px"} light />
      </Box>
    </RawButton>
  );
}
SearchInDataCatalog.propTypes = {
  handleClick: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};
export function SearchParcels({ viewState, handleClick }) {
  return (
    <RawButton
      fullWidth
      onClick={() => {
        // Set text here as a separate action so that it doesn't get batched up and the catalog
        // search text has a chance to set isWaitingToStartCatalogSearch
        handleClick && handleClick();
      }}
    >
      <Box paddedRatio={2} rounded charcoalGreyBg>
        <StyledIcon styledWidth={"14px"} glyph={GLYPHS.parcela} light />
        <Spacing right={2} />
        <Text textAlignLeft textLight large fullWidth>
          {i18next.t("dkpSearch.title")}
        </Text>
        <StyledIcon glyph={GLYPHS.right2} styledWidth={"14px"} light />
      </Box>
    </RawButton>
  );
}
SearchParcels.propTypes = {
  handleClick: PropTypes.func.isRequired,
  viewState: PropTypes.object.isRequired
};
const PresentationBox = styled(Box).attrs({
  fullWidth: true
})`
  ${(props) =>
    props.highlightBottom &&
    `
      // styled-components doesn't seem to prefix linear-gradient.. soo
      background-image: linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -o-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -moz-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -webkit-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
      background-image: -ms-linear-gradient(bottom, ${props.theme.greyLightest} 50%, transparent 50%);
    `}
`;

export const LOCATION_SEARCH_INPUT_NAME = "LocationSearchInput";
export class SearchBoxAndResultsRaw extends React.Component {
  constructor(props) {
    super(props);
    this.locationSearchRef = React.createRef();
  }
  componentDidMount() {
    this.props.viewState.updateAppRef(
      LOCATION_SEARCH_INPUT_NAME,
      this.locationSearchRef
    );
    this.subscribeToProps();
  }

  componentDidUpdate() {
    this.subscribeToProps();
  }

  componentWillUnmount() {
    this.unsubscribeFromProps();
  }

  subscribeToProps() {
    this.unsubscribeFromProps();

    // TODO(wing): why is this a reaction here and not in viewState itself?
    // Close the search results when the Now Viewing changes (so that it's visible).
    this._nowViewingChangeSubscription = reaction(
      () => this.props.terria.workbench.items,
      () => {
        this.props.viewState.searchState.showLocationSearchResults = false;
      }
    );
  }

  unsubscribeFromProps() {
    if (this._nowViewingChangeSubscription) {
      this._nowViewingChangeSubscription();
      this._nowViewingChangeSubscription = undefined;
    }
  }
  changeSearchText(newText) {
    runInAction(() => {
      this.props.viewState.searchState.locationSearchText = newText;
    });
    if (newText.length === 0) {
      removeMarker(this.props.terria);
      runInAction(() => {
        this.toggleShowLocationSearchResults(false);
      });
    }
    if (
      newText.length > 0 &&
      !this.props.viewState.searchState.showLocationSearchResults
    ) {
      runInAction(() => {
        this.toggleShowLocationSearchResults(true);
      });
    }
  }
  search() {
    this.props.viewState.searchState.searchLocations();
  }
  toggleShowLocationSearchResults(bool) {
    runInAction(() => {
      this.props.viewState.searchState.showLocationSearchResults = bool;
    });
  }
  startLocationSearch() {
    this.toggleShowLocationSearchResults(true);
  }

  @action.bound
  openParcelSearchTool() {
    const tool = {
      toolName: "Parcel search",
      getToolComponent: () =>
        import("../Tools/DkpSearch/DkpSearch").then((m) => m.default)
    };
    const { viewState } = this.props;
    if (
      viewState.currentTool &&
      viewState.currentTool.toolName === tool.toolName
    ) {
      viewState.closeTool();
    } else {
      viewState.openTool(tool);
      viewState.searchState.showLocationSearchResults = false;
    }
  }

  render() {
    const { viewState, placeholder } = this.props;
    const searchState = viewState.searchState;
    const locationSearchText = searchState.locationSearchText;

    const shouldShowResults =
      searchState.locationSearchText.length > 0 &&
      searchState.showLocationSearchResults;
    const showExtraSearchOptions =
      searchState.showLocationSearchResults &&
      !this.props.terria.configParameters.disableDkpSearch;
    return (
      <Text textDarker>
        <Box fullWidth>
          <PresentationBox highlightBottom={showExtraSearchOptions}>
            <SearchBox
              ref={this.locationSearchRef}
              onSearchTextChanged={this.changeSearchText.bind(this)}
              onDoSearch={this.search.bind(this)}
              onFocus={this.startLocationSearch.bind(this)}
              showClear={showExtraSearchOptions}
              searchText={searchState.locationSearchText}
              placeholder={placeholder}
            />
          </PresentationBox>
          {/* Results */}
          <If condition={showExtraSearchOptions}>
            <Box
              position={"absolute"}
              fullWidth
              column
              css={`
                top: 100%;
                background-color: ${(props) => props.theme.greyLightest};
                max-height: calc(100vh - 120px);
                border-radius: 0 0 ${(props) => props.theme.radius40Button}px
                  ${(props) => props.theme.radius40Button}px;
              `}
            >
              <Box column paddedRatio={2}>
                <SearchParcels
                  viewState={viewState}
                  handleClick={this.openParcelSearchTool.bind(this)}
                />
              </Box>
            </Box>
          </If>
          <If condition={shouldShowResults}>
            <Box
              position="absolute"
              fullWidth
              column
              css={`
                top: 100%;
                background-color: ${(props) => props.theme.greyLightest};
                max-height: calc(100vh - 120px);
                border-radius: 0 0 ${(props) => props.theme.radius40Button}px
                  ${(props) => props.theme.radius40Button}px;
              `}
            >
              {/* search {searchterm} in data catalog */}
              {/* ~TODO: Put this back once we add a MobX DataCatalogSearch Provider~ */}
              {/* TODO2: Implement a more generic MobX DataCatalogSearch */}
              {searchState.catalogSearchProvider && (
                <Box column paddedRatio={2}>
                  <SearchInDataCatalog
                    viewState={viewState}
                    handleClick={() => {
                      this.toggleShowLocationSearchResults(false);
                    }}
                  />
                </Box>
              )}
              <Box
                column
                css={`
                  overflow-y: auto;
                `}
              >
                <For
                  each="search"
                  of={this.props.viewState.searchState.locationSearchResults}
                >
                  <LocationSearchResults
                    key={search.searchProvider.name}
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                    search={search}
                    locationSearchText={locationSearchText}
                    onLocationClick={(result) => {
                      addMarker(this.props.terria, result);
                      result.clickAction();
                      runInAction(() => {
                        searchState.showLocationSearchResults = false;
                      });
                    }}
                    isWaitingForSearchToStart={
                      searchState.isWaitingToStartLocationSearch
                    }
                  />
                </For>
              </Box>
            </Box>
          </If>
        </Box>
      </Text>
    );
  }
}

SearchBoxAndResultsRaw.propTypes = {
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired,
  placeholder: PropTypes.string.isRequired
};

export default observer(SearchBoxAndResultsRaw);
