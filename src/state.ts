import { observable } from "@legendapp/state";
import { EXAMPLES } from "./examples";

export const appState = observable({
  envSource: EXAMPLES[0].envSource,
  typeSource: EXAMPLES[0].typeSource,
  currentExampleName: EXAMPLES[0].name,
});
