import { Ref, useRef, useEffect } from "react";
import ViewState from "../../ReactViewModels/ViewState";
import { LANGUAGE_SWITCHER_NAME } from "../LanguageSwitcher/LanguageSwitcher";

// really unsure if we update the app ref or leave it to the component to set,
// but it makes most sense to run it this way for now
export function useRefForTerria<E extends HTMLElement>(
  refName: string,
  viewState: ViewState // todo: reach into store without passing viewstate(?)
): Ref<E> {
  const ref = useRef<E>(null);

  useEffect(() => {
    if (ref && ref.current) {
      viewState.updateAppRef(refName, ref);
    }
    // cleanup callback
    return function removeRefFromTerria() {
      if (refName !== LANGUAGE_SWITCHER_NAME) {
        viewState.deleteAppRef(refName);
      }
    };
  }, [ref]);
  return ref;
}
