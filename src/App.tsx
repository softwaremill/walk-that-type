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
    try {
      if (typeToEval) {
        setEvaled(
          JSON.stringify(
            evalType(createEnvironment(envSourceCode), typeToEval),
            null,
            2
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
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
      <pre>{JSON.stringify(typeToEval, null, 2)}</pre>

      <h2>Evaled type</h2>
      <pre>{evaled}</pre>
    </div>
  );
}

export default App;
