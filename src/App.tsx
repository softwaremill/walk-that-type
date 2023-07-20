import { Button, Divider, Flex, Grid, Stack, Text, Title } from "@mantine/core";

import { printTypeNode } from "./interpreter/TypeNode";
import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { Fragment } from "react";
// import { Accordion } from "@mantine/core";
import { CodeBlock } from "./components/CodeBlock";
import { EvalDescription } from "./components/EvalDescription";
import { enableLegendStateReact } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import { CodeEditor } from "./components/CodeEditor";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { useSelector } from "@legendapp/state/react";
import { createEnvironment } from "./interpreter/environment";
import { createTypeToEval } from "./interpreter";
import { Do, some } from "this-is-ok/option";
import { formatCode } from "./utils/formatCode";

enableReactUse();
enableLegendStateReact();

const state = observable({
  envSource:
    "type Last<T extends any> = T extends [infer L] ? L : T extends [infer _, ...infer Rest] ? Last<Rest> : never;",
  typeSource: "Last<[1, 2, 3]>",
});

const App = () => {
  const envSource = state.envSource.use();
  const typeSource = state.typeSource.use();
  const trace = useSelector(() =>
    Do(() => {
      const env = createEnvironment(envSource).bind();
      const typeToEval = createTypeToEval(typeSource).bind();
      return some(getEvalTrace(typeToEval, env));
    })
  );

  return (
    <Stack p={32} w="100%" mih={"100vh"} mah={"100vh"}>
      <Title color="#35545a">walk-that-type 0.1.0</Title>

      <Divider size="sm" color="#b2cdd2" />

      <Grid grow gutter="lg" mah="100%">
        <Grid.Col span={4}>
          <Stack>
            <Title color="#35545a" order={3}>
              Environment editor
            </Title>

            <CodeEditor
              code={envSource}
              onCodeUpdate={(t) => {
                state.envSource.set(t);
              }}
            />
            <Flex w="100%" justify="flex-end">
              <Button
                variant="light"
                color="cyan"
                compact
                onClick={() => {
                  formatCode(envSource).then((formatted) => {
                    state.envSource.set(formatted);
                  });
                }}
              >
                Format
              </Button>
            </Flex>
          </Stack>
        </Grid.Col>

        <Grid.Col span={6} mah="85vh">
          <Stack mah="100%" px={6}>
            <Stack>
              <Title color="#35545a" order={3}>
                Type to evaluate
              </Title>
              <CodeEditor
                code={typeSource}
                onCodeUpdate={(t) => {
                  state.typeSource.set(t);
                }}
              />
            </Stack>

            <Divider color="#b2cdd2" mb={"md"} />

            <Stack mah="100%" sx={{ overflowY: "auto" }}>
              {trace.isSome && renderTrace(trace.value)}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>

      <Flex pos={"fixed"} bottom={16} w="100%" justify="center">
        <Text size={14} color="gray.7">
          Made in 🇵🇱 by Mieszko Sabo
        </Text>
      </Flex>
    </Stack>
  );
};

function renderTrace(trace: EvalTrace) {
  const [initialType, ...steps] = trace;

  return (
    <Stack mah="100%">
      <CodeBlock code={printTypeNode(initialType)} />
      {steps.map((step, idx) => (
        <Fragment key={`${step.result.nodeId}-${idx}`}>
          {/* <Accordion>
            <Accordion.Item value="expand">
              <Accordion.Control>Expand</Accordion.Control>
              <Accordion.Panel>{renderTrace(step.evalTrace)}</Accordion.Panel>
            </Accordion.Item>
          </Accordion> */}
          {/* <pre>{JSON.stringify(step.resultEnv, null, 2)}</pre> */}

          <EvalDescription desc={step.evalDescription} />
          <CodeBlock code={printTypeNode(step.result)} />
        </Fragment>
      ))}
    </Stack>
  );
}

export default App;
