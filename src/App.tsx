import { useState } from "react";
import { createEnvironment, createTypeToEval } from "./interpreter";

function App() {
  const [envSourceCode, setEnvSourceCode] = useState("type A = 42;");
  const [typeToEvalSourceCode, setTypeToEvalSourceCode] = useState("42");

  const env = createEnvironment(envSourceCode);
  console.log("env", env);

  const typToEval = createTypeToEval(typeToEvalSourceCode);
  console.log("type to eval", typToEval);

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
      <pre>{JSON.stringify(typToEval, null, 2)}</pre>
    </div>
  );
}

export default App;
