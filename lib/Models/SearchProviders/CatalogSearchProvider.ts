import i18next from "i18next";
import {
  autorun,
  computed,
  observable,
  runInAction,
  makeObservable
} from "mobx";
import { fromPromise } from "mobx-utils";
import {
  Category,
  SearchAction
} from "../../Core/AnalyticEvents/analyticEvents";
import isDefined from "../../Core/isDefined";
import { TerriaErrorSeverity } from "../../Core/TerriaError";
import GroupMixin from "../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../ModelMixins/ReferenceMixin";
import { BaseModel } from "../Definition/Model";
import Terria from "../Terria";
import SearchProvider from "./SearchProvider";
import SearchProviderResults from "./SearchProviderResults";
import SearchResult from "./SearchResult";
interface CatalogSearchProviderOptions {
  terria: Terria;
}

type UniqueIdString = string;
type ResultMap = Map<UniqueIdString, boolean>;
export function loadAndSearchCatalogRecursively(
  models: BaseModel[],
  searchTextLowercase: string,
  searchResults: SearchProviderResults,
  resultMap: ResultMap,
  iteration: number = 0
): Promise<void> {
  // checkTerriaAgainstResults(terria, searchResults)
  // don't go further than 10 deep, but also if we have references that never
  // resolve to a target, might overflow
  if (iteration > 10) {
    return Promise.resolve();
  }
  // add some public interface for terria's `models`?
  const referencesAndGroupsToLoad: any[] = models.filter((model: any) => {
    if (resultMap.get(model.uniqueId) === undefined) {
      const modelToSave = model.target || model;
      // Use a flattened string of definition data later,
      // without only checking name/id/descriptions?
      // saveModelToJson(modelToSave, {
      //   includeStrata: [CommonStrata.definition]
      // });
      autorun((reaction) => {
        let modelInformation: string = JSON.stringify(
          prepareCatalogMemberForSearch(modelToSave)
        );

        const matchesString =
          modelInformation.toLowerCase().indexOf(searchTextLowercase) !== -1;
        resultMap.set(model.uniqueId, matchesString);
        if (matchesString) {
          runInAction(() => {
            searchResults.results.push(
              new SearchResult({
                name: modelToSave.name,
                catalogItem: modelToSave
              })
            );
          });
        }
        reaction.dispose();
      });
    }

    if (ReferenceMixin.isMixedInto(model) || GroupMixin.isMixedInto(model)) {
      return true;
    }
    return false;
  });

  // If we have no members to load
  if (referencesAndGroupsToLoad.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    autorun((reaction) => {
      Promise.all(
        referencesAndGroupsToLoad.map(async (model) => {
          if (ReferenceMixin.isMixedInto(model)) {
            // TODO: could handle errors better here
            (await model.loadReference()).throwIfError();
          } else if (GroupMixin.isMixedInto(model)) {
            (await model.loadMembers()).throwIfError();
          }
        })
      ).then(() => {
        // Then call this function again to see if new child references were loaded in
        resolve(
          loadAndSearchCatalogRecursively(
            models,
            searchTextLowercase,
            searchResults,
            resultMap,
            iteration + 1
          )
        );
      });
      reaction.dispose();
    });
  });
}

export default class CatalogSearchProvider extends SearchProvider {
  readonly terria: Terria;
  @observable isSearching: boolean = false;
  @observable debounceDurationOnceLoaded: number = 300;

  constructor(options: CatalogSearchProviderOptions) {
    super();

    makeObservable(this);

    this.terria = options.terria;
    this.name = i18next.t("search.catalog.name");
  }

  @computed get resultsAreReferences() {
    return (
      isDefined(this.terria.catalogIndex?.loadPromise) &&
      fromPromise(this.terria.catalogIndex!.loadPromise).state === "fulfilled"
    );
  }

  protected async doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    runInAction(() => (this.isSearching = true));

    searchResults.results.length = 0;
    searchResults.message = undefined;

    if (searchText === undefined || /^\s*$/.test(searchText)) {
      runInAction(() => (this.isSearching = false));
      return Promise.resolve();
    }

    // Load catalogIndex if needed
    if (this.terria.catalogIndex && !this.terria.catalogIndex.loadPromise) {
      try {
        await this.terria.catalogIndex.load();
      } catch (e) {
        this.terria.raiseErrorToUser(
          e,
          "Failed to load catalog index. Searching may be slow/inaccurate"
        );
      }
    }

    this.terria.analytics?.logEvent(
      Category.search,
      SearchAction.catalog,
      searchText
    );
    const resultMap: ResultMap = new Map();

    try {
      if (this.terria.catalogIndex?.searchIndex) {
        const results = await this.terria.catalogIndex.search(searchText);
        runInAction(() => (searchResults.results = results));
      } else {
        await loadAndSearchCatalogRecursively(
          this.terria.modelValues,
          searchText.toLowerCase(),
          searchResults,
          resultMap
        );
      }

      runInAction(() => {
        this.isSearching = false;
      });

      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      runInAction(() => {
        this.terria.catalogReferencesLoaded = true;
      });

      if (searchResults.results.length === 0) {
        searchResults.message = i18next.t("search.catalog.noResults");
      }
    } catch (e) {
      this.terria.raiseErrorToUser(e, {
        message: "An error occurred while searching",
        severity: TerriaErrorSeverity.Warning
      });
      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      searchResults.message = i18next.t("search.catalog.error");
    }
  }
}

function prepareCatalogMemberForSearch(model: any) {
  const result = [];
  const name = model.name;
  if (name) {
    result.push(name);
  }
  const uniqueId = model.uniqueId;
  if (uniqueId) result.push(uniqueId);
  const description = model.description;
  if (description) {
    result.push(description);
  }
  const info = model.info;
  if (info && Array.isArray(info)) {
    for (let i = 0; i < info.length; i++) {
      const content = info[i].content;
      if (content) result.push(content);
    }
  }
  return result;
}
