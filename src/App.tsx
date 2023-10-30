import GitHubButton from "react-github-btn";

import { EvalStep, EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { enableLegendStateReact } from "@legendapp/state/react";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { useSelector } from "@legendapp/state/react";
import { createEnvironment } from "./interpreter/environment";
import { some, Do, none, Option } from "this-is-ok/option";
import { createTypeToEval } from "./interpreter/type-node/create-type-to-eval";
import {
  Box,
  Button,
  Code,
  Flex,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import Editor from "@monaco-editor/react";
import { ExamplesSelector } from "./components/example-selector";
import { appState } from "./state";
import { CodeBlock } from "./components/code-block";
import { printTypeNode } from "./interpreter/type-node";
import { useEffect, useState } from "react";
import { DividingLine, EvalDescription } from "./components/eval-description";

enableReactUse();
enableLegendStateReact();

const App = () => {
  const envSource = appState.envSource.use();
  const typeSource = appState.typeSource.use();
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

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Stack p={6}>
      <ExamplesSelector />
      <Flex justify="space-between" align="center">
        <Flex gap={1} align="center">
          <Text
            color={colorMode === "dark" ? "gray.200" : "gray.600"}
            fontSize={18}
            as="span"
            fontWeight="regular"
          >
            Softwaremill /
          </Text>
          <Text
            color={colorMode === "dark" ? "gray.100" : "gray.600"}
            as="span"
            fontSize={18}
            fontWeight="semibold"
          >
            Walk That Type
          </Text>
        </Flex>
        <Flex align="center">
          <Button
            variant="ghost"
            as="a"
            target="_blank"
            href="https://github.com/softwaremill/walk-that-type/issues/new?projects=&template=bug_report.md&title="
          >
            Report a bug
          </Button>
          <IconButton
            variant="ghost"
            colorScheme="gray"
            aria-label="toggle-color-theme"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            mr={3}
          />
          <Box mt={2}>
            <GitHubButton
              href="https://github.com/softwaremill/walk-that-type"
              data-show-count="true"
              aria-label="Star softwaremill/walk-that-type on GitHub"
            >
              Star
            </GitHubButton>
          </Box>
        </Flex>
      </Flex>
      <Stack mt={8} spacing={4}>
        <Text fontWeight="medium">Step 1: Define types</Text>
        <Stack
          p={2}
          py={4}
          bg={colorMode === "light" ? "white" : "#1E1E1E"}
          borderRadius={6}
          shadow="md"
        >
          <Editor
            height="300px"
            width="100%"
            options={{
              minimap: { enabled: false },
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
              renderLineHighlight: "none",
            }}
            theme={colorMode === "light" ? "vs" : "vs-dark"}
            defaultLanguage="typescript"
            value={envSource}
            onChange={(value) => {
              if (value) {
                appState.envSource.set(value);
              }
            }}
          />
        </Stack>
      </Stack>
      <Stack mt={8} spacing={4}>
        <Text fontWeight="medium">
          Step 2: Assign some type to a <Code>_wtt</Code> variable to walk
          through it!
        </Text>
        <Stack
          p={2}
          py={4}
          bg={colorMode === "light" ? "white" : "#1E1E1E"}
          borderRadius={6}
          shadow="md"
        >
          <Editor
            height="110px"
            width="100%"
            options={{
              minimap: { enabled: false },
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
              renderLineHighlight: "none",
            }}
            theme={colorMode === "light" ? "vs" : "vs-dark"}
            defaultLanguage="typescript"
            value={typeSource}
            onChange={(value) => {
              if (value) {
                appState.typeSource.set(value);
              }
            }}
          />
        </Stack>
      </Stack>

      <Stack mt={8}>
        <Text mb={2} fontWeight="medium">
          Step 3: Walk through it!
        </Text>
        {trace.isSome ? (
          <WalkThatType trace={trace.value} />
        ) : (
          <Stack>
            Assign some type to _wtt in Step 2 to see the evaluation!
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

import { P, match } from "ts-pattern";

type WalkThatTypeProps = {
  trace: EvalTrace;
};

const WalkThatType = ({ trace }: WalkThatTypeProps) => {
  const [initialType, ...steps] = trace;

  return (
    <Stack>
      <CodeBlock code={printTypeNode(initialType)} />
      <WalkThatTypeNextStep steps={steps} />
    </Stack>
  );
};

const WalkThatTypeNextStep = ({ steps }: { steps: EvalStep[] }) => {
  const [currentStep, ...nextSteps] = steps;
  const [state, setState] = useState<"choice" | "step-over" | "step-into">(
    "choice"
  );

  useEffect(() => {
    setState("choice");
  }, [steps]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      <Stack>
        <EvalDescription
          desc={currentStep.evalDescription}
          {...(state === "step-over"
            ? { expandable: true, onExpand: () => setState("step-into") }
            : { expandable: false })}
        />
      </Stack>
      {match([currentStep.evalDescription, state])
        .with([{ _type: "substituteWithDefinition" }, "choice"], () => (
          <Flex gap={6} justify="center">
            <Button
              onClick={() => setState("step-over")}
              colorScheme="blue"
              variant="outline"
            >
              Step over
            </Button>

            <Button onClick={() => setState("step-into")} colorScheme="teal">
              Step into
            </Button>
          </Flex>
        ))
        .with([{ _type: "substituteWithDefinition" }, "step-over"], () => (
          <>
            <CodeBlock code={printTypeNode(currentStep.result)} />
            <WalkThatTypeNextStep steps={nextSteps} />
          </>
        ))
        .with(
          [
            P.shape({ _type: "substituteWithDefinition" }).select(),
            "step-into",
          ],
          (evalDescription) => (
            <>
              <Stack
                p={6}
                pb={12}
                borderStyle="solid"
                borderWidth={2}
                borderColor="gray.300"
                borderRadius={6}
                position="relative"
              >
                <Text fontSize={12} color="gray.500" mb={2}>
                  Evaluating: <Code fontSize={12}>{evalDescription.name}</Code>
                </Text>
                <Button
                  size={"sm"}
                  position={"absolute"}
                  bottom={2}
                  right={2}
                  variant="ghost"
                  colorScheme="teal"
                  onClick={() => setState("step-over")}
                >
                  Collapse
                </Button>
                <WalkThatType trace={evalDescription.evalTrace} />
              </Stack>
              <Flex w="full" justify="center">
                <DividingLine />
              </Flex>
              <CodeBlock code={printTypeNode(currentStep.result)} />
              <WalkThatTypeNextStep steps={nextSteps} />
            </>
          )
        )
        .otherwise(() => (
          <>
            <CodeBlock code={printTypeNode(currentStep.result)} />
            <WalkThatTypeNextStep steps={nextSteps} />
          </>
        ))}
    </>
  );
};

export default App;
