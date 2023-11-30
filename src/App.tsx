import GitHubButton from "react-github-btn";

import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { enableLegendStateReact } from "@legendapp/state/react";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { useSelector } from "@legendapp/state/react";
import { createEnvironment } from "./interpreter/environment";
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
import { AppState } from "./state";
import debounce from "lodash.debounce";
import { Result, Do, fromThrowable } from "this-is-ok/result";
import { WalkThatType } from "./components/walk-that-type";
import { getStateFromUrl, persistStateInUrl } from "./utils/compression";
import { EXAMPLES } from "./examples";
import { observable } from "@legendapp/state";
import { ErrorMessage } from "./components/error-message";

const debouncedPersistStateInUrl = debounce(persistStateInUrl, 500);

const initState = getStateFromUrl().unwrapOr({
  envSource: EXAMPLES[0].envSource,
  typeSource: EXAMPLES[0].typeSource,
  currentExampleName: EXAMPLES[0].name,
});

export const appState = observable<AppState>(initState);

enableReactUse();
enableLegendStateReact();

const App = () => {
  const envSource = appState.envSource.use();
  const typeSource = appState.typeSource.use();
  const trace = useSelector<Result<EvalTrace, string>>(() =>
    Do(() => {
      const env = createEnvironment(envSource)
        .mapErr(
          (e) => `Error in while creating environment (Step 1): ${e.message}`
        )
        .bind();
      const typeToEval = createTypeToEval(typeSource)
        .mapErr(
          (e) =>
            `Error in while creating type to evaluate (Step 2): ${e.message}`
        )
        .bind();
      const trace = fromThrowable(() => getEvalTrace(typeToEval, env)).mapErr(
        (e) => `Error while creating evaluation steps: ${e.message}`
      );
      return trace;
    })
  );

  appState.onChange(({ value }) => {
    debouncedPersistStateInUrl(value);
  });

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
        {trace.isOk ? (
          <WalkThatType trace={trace.value} />
        ) : (
          <ErrorMessage error={trace.error} />
        )}
      </Stack>
    </Stack>
  );
};

export default App;
