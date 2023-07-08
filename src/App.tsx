import { useEffect, useState } from "react";
import { createTypeToEval } from "./interpreter";
import { evalType } from "./interpreter/eval";
import { createEnvironment } from "./interpreter/environment";
import { findAvailableCommands } from "./interpreter/commands";

function App() {
  const [envSourceCode, setEnvSourceCode] = useState(
    "type First<T extends any[]> = T extends [infer Head, ...any] ? Head : never;"
  );
  const [typeToEvalSourceCode, setTypeToEvalSourceCode] =
    useState("First<[1, 2, 3]>");

  const env = createEnvironment(envSourceCode);
  console.log("env", env);

  const typeToEval = createTypeToEval(typeToEvalSourceCode);
  console.log("type to eval", typeToEval);

  const [evaled, setEvaled] = useState("");

  useEffect(() => {
    typeToEval.map((ty) => {
      createEnvironment(envSourceCode).map((env) => {
        const evaledTy = evalType(env, ty);
        if (evaledTy.isOk) {
          setEvaled(evaledTy.unwrap().text);
        } else {
          setEvaled(
            "ERROR: " + (evaledTy.variant === "err" ? evaledTy.error : "")
          );
        }
      });
    });
  }, [envSourceCode, typeToEvalSourceCode]);

  return (
    <div>
      <h2>Environment</h2>
      {env.isErr && "error" in env && env.error instanceof Error && (
        <pre style={{ color: "red" }}>{env.error.message}</pre>
      )}
      <textarea
        value={envSourceCode}
        onChange={(e) => {
          setEnvSourceCode(e.target.value);
        }}
      />

      <h2>Type to evaluate</h2>
      <textarea
        value={typeToEvalSourceCode}
        onChange={(e) => {
          setTypeToEvalSourceCode(e.target.value);
        }}
      />
      {typeToEval.isOk ? (
        <pre>{JSON.stringify(typeToEval.unwrap(), null, 2)}</pre>
      ) : (
        <pre style={{ color: "red" }}>
          {JSON.stringify(typeToEval, null, 2)}
        </pre>
      )}

      <h2>Cmds</h2>
      <pre>
        {typeToEval.isOk &&
          typeToEval
            .map((v) =>
              JSON.stringify(
                findAvailableCommands(env.unwrapOr({}), v),
                null,
                2
              )
            )
            .unwrap()}
      </pre>
      <h2>Evaled type</h2>
      {typeToEval.isErr &&
        "error" in typeToEval &&
        typeToEval.error instanceof Error && (
          <pre style={{ color: "red" }}>{typeToEval.error.message}</pre>
        )}
      <pre>{evaled}</pre>
    </div>
  );
}

export default App;
