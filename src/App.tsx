import GitHubButton from "react-github-btn";

import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { enableLegendStateReact } from "@legendapp/state/react";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { useSelector } from "@legendapp/state/react";
import { createEnvironment } from "./interpreter/environment";
import { some, Do, none, Option } from "this-is-ok/option";
import { createTypeToEval } from "./interpreter/type-node/create-type-to-eval";
import {
  Box,
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
import { Fragment } from "react";
import { EvalDescription } from "./components/eval-description";

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
          <Text fontSize={18} as="span" fontWeight="regular">
            Softwaremill{" "}
          </Text>
          /
          <Text as="span" fontSize={18} fontWeight="semibold">
            Walk That Type
          </Text>
        </Flex>
        <Flex align="center">
          <IconButton
            variant="ghost"
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
        >
          <Editor
            height="300px"
            width="100%"
            options={{
              minimap: { enabled: false },
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
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
        >
          <Editor
            height="110px"
            width="100%"
            options={{
              minimap: { enabled: false },
              overviewRulerBorder: false,
              overviewRulerLanes: 0,
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
        <Text fontWeight="medium">Step 3: Walk through it!</Text>
        <Stack>{trace.isSome && renderTrace(trace.value)}</Stack>
      </Stack>
    </Stack>
  );
};

import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";

function renderTrace(trace: EvalTrace) {
  const [initialType, ...steps] = trace;
  return (
    <Stack maxH="100%">
      <CodeBlock code={printTypeNode(initialType)} />
      {steps.map((step, idx) => (
        <Fragment key={`${step.result.nodeId}-${idx}`}>
          <EvalDescription desc={step.evalDescription} />
          {step.evalDescription._type === "substituteWithDefinition" && (
            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Step into evaluation
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  {renderTrace(step.evalDescription.evalTrace)}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          <CodeBlock code={printTypeNode(step.result)} />
        </Fragment>
      ))}
    </Stack>
  );
}

export default App;
