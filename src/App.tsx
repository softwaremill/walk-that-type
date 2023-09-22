import { Button, Divider, Flex, Grid, Stack, Text, Title } from "@mantine/core";

import { printTypeNode } from "./interpreter/type-node";
import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { Fragment } from "react";
import { Accordion } from "@mantine/core";
import { CodeBlock } from "./components/CodeBlock";
import { EvalDescription } from "./components/EvalDescription";
import { enableLegendStateReact } from "@legendapp/state/react";
import { observable } from "@legendapp/state";
import { CodeEditor } from "./components/CodeEditor";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { useSelector } from "@legendapp/state/react";
import { createEnvironment } from "./interpreter/environment";
import { some, Do, none, Option } from "this-is-ok/option";
import { formatCode } from "./utils/formatCode";
import { Select } from "@mantine/core";
import { createTypeToEval } from "./interpreter/type-node/create-type-to-eval";

enableReactUse();
enableLegendStateReact();

const EXAMPLES = [
  {
    name: "Mapped types",
    envSource: `type Example = {
      [k in "a" | "b" as 41]: 42
    };`,
    typeSource: `Example`,
  },
  {
    name: "Distributed union types",
    envSource: `type ToArray<T1, T2> = T1 extends any ? 
    T2 extends any 
        ? [T1, T2]
        : never
    : never;`,
    typeSource: `ToArray<string | number, 1 | 2>`,
  },
  {
    name: "Intrinsic types",
    envSource: "",
    typeSource: `Uppercase<"hello"> | Lowercase<"HowDY"> | Capitalize<"hey"> | Uncapitalize<"Hey">`,
  },
  {
    name: "Object type2",
    envSource: "",
    typeSource: `{
      a: 42,
      b: {
        c: 123,
        d: true | false
      }
    }`,
  },
  {
    name: "Simplify union",
    envSource: "type constNever<T> = never;",
    typeSource: "42 | 'hello' | 'hello' | never | constNever<42>",
  },
  {
    name: "Reverse",
    envSource:
      "type Reverse<T extends any[]> = T extends [infer Head, ...infer Tail] ? [...Reverse<Tail>, Head] : [];",
    typeSource: "Reverse<[1, 2, 3]>;",
  },
  {
    name: "EvalTrace test",
    envSource: "type Concat<A extends any[], B extends any[]> = [...A, ...B];",
    typeSource: "[Concat<[1], [2]>, Concat<[3], [4]>];",
  },
  {
    name: "Concat",
    envSource: "type Concat<A extends any[], B extends any[]> = [...A, ...B];",
    typeSource: "Concat<[1, 2], Concat<[3, 4], [1, 2, 3]>>;",
  },
  {
    name: "LastRecursive",
    envSource:
      "type Last<T extends any[]> = T extends [infer L] ? L : T extends [infer _, ...infer Rest] ? Last<Rest> : never;",
    typeSource: "Last<[1, 2, 3]>;",
  },
  {
    name: "LastRecursive in tuple",
    envSource:
      "type Last<T extends any[]> = T extends [infer L] ? L : T extends [infer _, ...infer Rest] ? Last<Rest> : never;",
    typeSource: "[Last<[1, 2]>];",
  },
];

const state = observable({
  envSource: EXAMPLES[0].envSource,
  typeSource: EXAMPLES[0].typeSource,
  currentExampleName: EXAMPLES[0].name,
});

const App = () => {
  const envSource = state.envSource.use();
  const typeSource = state.typeSource.use();
  const trace = useSelector<Option<EvalTrace>>(() =>
    Do(() => {
      const env = createEnvironment(envSource).bind();
      const typeToEval = createTypeToEval(typeSource).bind();
      try {
        const trace = getEvalTrace(typeToEval, env);
        return some(trace);
      } catch (e) {
        console.error(e);
        return none;
      }
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
              Examples
            </Title>
            <Select
              value={state.currentExampleName.get()}
              onChange={(name) => {
                if (name) {
                  const idx = EXAMPLES.findIndex((e) => e.name === name);
                  state.envSource.set(EXAMPLES[idx].envSource);
                  state.typeSource.set(EXAMPLES[idx].typeSource);
                  state.currentExampleName.set(name);
                }
              }}
              data={EXAMPLES.map((e) => e.name)}
            />

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

            <Divider color="#b2cdd2" my={"md"} />

            <Stack mah="100%" sx={{ overflowY: "auto" }}>
              {trace.isSome && renderTrace(trace.value)}
            </Stack>
          </Stack>
        </Grid.Col>
      </Grid>

      <Flex pos={"fixed"} bottom={16} w="100%" justify="center">
        <Text size={14} color="gray.7">
          Created by{" "}
          <Text
            weight="bold"
            component="a"
            href="https://softwaremill.com/"
            target="_blank"
          >
            SoftwareMill
          </Text>
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
          <EvalDescription desc={step.evalDescription} />
          {step.evalDescription._type === "substituteWithDefinition" && (
            <Accordion>
              <Accordion.Item value="expand">
                <Accordion.Control>Step into evaluation</Accordion.Control>
                <Accordion.Panel>
                  {renderTrace(step.evalDescription.evalTrace)}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}

          <CodeBlock code={printTypeNode(step.result)} />
        </Fragment>
      ))}
    </Stack>
  );
}

export default App;
