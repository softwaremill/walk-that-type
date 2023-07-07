import { useEffect, useState } from "react";
import { createEnvironment, createTypeToEval } from "./interpreter";
import { evalType } from "./interpreter/eval";

function App() {
  const [envSourceCode, setEnvSourceCode] = useState("type A<X> = X;");
  const [typeToEvalSourceCode, setTypeToEvalSourceCode] =
    useState("A<'hello'>");

  const env = createEnvironment(envSourceCode);
  console.log("env", env);

  const typeToEval = createTypeToEval(typeToEvalSourceCode);
  console.log("type to eval", typeToEval);

  const [evaled, setEvaled] = useState("");

  useEffect(() => {
    typeToEval.tap((ty) => {
      createEnvironment(envSourceCode).tap((env) => {
        evalType(env, ty).tap((evaledTy) => {
          setEvaled(evaledTy.text);
        });
      });
    });
  }, [envSourceCode, typeToEvalSourceCode]);

  return (
    <div>
      <h2>Environment</h2>
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
      {typeToEval.isSome && (
        <pre>{JSON.stringify(typeToEval.unwrap(), null, 2)}</pre>
      )}

      <h2>Evaled type</h2>
      <pre>{evaled}</pre>
    </div>
  );
}

export default App;
