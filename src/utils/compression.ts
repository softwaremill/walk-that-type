import { Option, from, of } from "this-is-ok/option";
import { AppState } from "../state";
import JSURL from "jsurl2";

const compress = (state: AppState): string => {
  return encodeURIComponent(JSURL.stringify(state));
};

const decompress = (compressedState: string): Option<AppState> => {
  return from(() => {
    return JSURL.parse(decodeURIComponent(compressedState)) as AppState;
  });
};

export const persistStateInUrl = (state: AppState): void => {
  window.history.replaceState(
    {},
    "",
    window.location.pathname + "?state=" + compress(state)
  );
};

export const getStateFromUrl = (): Option<AppState> => {
  const urlParams = new URLSearchParams(window.location.search);
  return of(urlParams.get("state")).flatMap(decompress);
};
