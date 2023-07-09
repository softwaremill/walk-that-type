import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Environment, createEnvironment } from "./interpreter/environment";
import { NodeId, TypeNode } from "./interpreter/TypeNode";
import { createTypeToEval } from "./interpreter";
import { findAvailableCommands } from "./interpreter/commands";
import { RootState } from "./store";

export type AppState = {
  envSourceCode: string;
  TypeToEvalSourceCode: string;
  env: Environment | string;
  initialTypeToEval: TypeNode | string;
  currentlyEvaledType: TypeNode | null;
  evaledTypeHistory: TypeNode[];
};

const INITIAL_ENV =
  "type First<T extends any[]> = T extends [infer H, ...any[]] ? H : never;";
const INITIAL_TYPE_TO_EVAL = "First<[1, 2, 3]>";

const initialState: AppState = {
  envSourceCode: INITIAL_ENV,
  TypeToEvalSourceCode: INITIAL_TYPE_TO_EVAL,
  env: createEnvironment(INITIAL_ENV).isOk
    ? createEnvironment(INITIAL_ENV).unwrap()
    : "Error: something wrong with the environment",
  initialTypeToEval: createTypeToEval(INITIAL_TYPE_TO_EVAL).isOk
    ? createTypeToEval(INITIAL_TYPE_TO_EVAL).unwrap()
    : "Error: something wrong with the type",
  currentlyEvaledType: createTypeToEval(INITIAL_TYPE_TO_EVAL).isOk
    ? createTypeToEval(INITIAL_TYPE_TO_EVAL).unwrap()
    : null,
  evaledTypeHistory: [createTypeToEval(INITIAL_TYPE_TO_EVAL).unwrap()],
};

export const AppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setEnvSourceCode: (
      state,
      action: PayloadAction<AppState["envSourceCode"]>
    ) => {
      const env = createEnvironment(action.payload);
      state.envSourceCode = action.payload;
      state.env = env.isOk
        ? env.unwrap()
        : "ERROR: something wrong with this environment";
    },
    setTypeToEvalSourceCode: (
      state,
      action: PayloadAction<AppState["TypeToEvalSourceCode"]>
    ) => {
      state.TypeToEvalSourceCode = action.payload;
      const typeToEval = createTypeToEval(action.payload);

      state.initialTypeToEval = typeToEval.isOk
        ? typeToEval.unwrap()
        : "ERROR: something wrong with this type";
      state.currentlyEvaledType = typeToEval.isOk ? typeToEval.unwrap() : null;
      state.evaledTypeHistory = typeToEval.isOk
        ? [createTypeToEval(action.payload).unwrap()]
        : [];
    },
    executeCommand: (state, action: PayloadAction<NodeId>) => {
      // TODO:
    },
  },
});

export const { setEnvSourceCode, setTypeToEvalSourceCode, executeCommand } =
  AppSlice.actions;

export const selectAvailableCommands = createSelector(
  (state: RootState) => state.app.env,
  (state: RootState) => state.app.currentlyEvaledType,
  (env, currentlyEvaledType) => {
    if (typeof env === "string") return [];
    if (currentlyEvaledType === null) return [];
    return Object.values(findAvailableCommands(env, currentlyEvaledType));
  }
);
export default AppSlice.reducer;
