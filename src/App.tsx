import GitHubButton from "react-github-btn";

import { printTypeNode } from "./interpreter/type-node";
import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
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
import { createTypeToEval } from "./interpreter/type-node/create-type-to-eval";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { MoonIcon, RepeatIcon, SunIcon } from "@chakra-ui/icons";

enableReactUse();
enableLegendStateReact();

const EXAMPLES = [
  {
    name: "Omit",
    envSource: `
    type Todo {
      title: string;
      description: string;
      completed: boolean;
    }
     `,
    typeSource: `Omit<Todo, "title" | "completed">`,
  },
  {
    name: "keyof",
    envSource: "",
    typeSource: `keyof { a: 1, b: 2, c: 3}`,
  },
  {
    name: "Pick",
    envSource: `
    type Todo {
      title: string;
      description: string;
      completed: boolean;
    }
     `,
    typeSource: `Pick<Todo, "title" | "completed">`,
  },
  {
    name: "Indexed access types",
    envSource: "",
    typeSource: `{
    a: 1,
    b: 2,
    c: 3
  }["b"]`,
  },
  {
    name: "Indexed access types2",
    envSource: "",
    typeSource: `[1, 2, 3][2]`,
  },
  {
    name: "Mapped types",
    envSource: "",
    typeSource: `{
      [k in "a" | "b" as Uppercase<k>]: k
    };`,
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
    name: "Object type",
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

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Stack p={4}>
      <Flex justify="flex-end" align="center" px={4}>
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

      <ExamplesSelector />
    </Stack>
  );
};

import { motion, isValidMotionProp } from "framer-motion";

import { chakra, shouldForwardProp } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
const AnimatedBox = chakra(motion.div, {
  shouldForwardProp: (prop) =>
    isValidMotionProp(prop) || shouldForwardProp(prop),
});

const ExamplesSelector = () => {
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: true,
  });
  const bgColor = useColorModeValue("gray.100", "teal.700");
  const textColor = useColorModeValue("gray.900", "gray.100");

  return (
    <AnimatedBox
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      display="flex"
      flexDir="column"
      position="absolute"
      animate={{ top: isOpen ? 0 : -105 }}
      top={0}
      w="36vw"
      minW="300px"
      maxW="600px"
      h="140px"
      left={0}
      right={0}
      ml="auto"
      mr="auto"
      alignItems="center"
    >
      <Flex
        p={8}
        w="100%"
        color={textColor}
        bg={bgColor}
        h="150px"
        borderBottomRadius="md"
        justify="center"
        align="center"
      >
        <Flex gap={3}>
          <Select>
            {EXAMPLES.map((example) => (
              <option
                key={example.name}
                value={example.name}
                onClick={() => {
                  state.envSource.set(example.envSource);
                  state.typeSource.set(example.typeSource);
                  state.currentExampleName.set(example.name);
                }}
              >
                {example.name}
              </option>
            ))}
          </Select>
          <IconButton aria-label="reset-preset" icon={<RepeatIcon />} />
        </Flex>
      </Flex>
      <Flex
        bg={bgColor}
        w="30%"
        justify="center"
        borderBottomRadius={"md"}
        align={"flex-end"}
        p={2}
      >
        <Text fontSize={13} fontWeight="semibold" color={textColor}>
          Pick from examples ✨
        </Text>
      </Flex>
    </AnimatedBox>
  );
};

export default App;
