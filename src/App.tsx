import { Box, Divider, Flex, Space, Stack, Text } from "@mantine/core";
import { Prism } from "@mantine/prism";

import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import tsLanguageSyntax from "highlight.js/lib/languages/typescript";
import { useTypedDispatch, useTypedSelector } from "./store";
import {
  INITIAL_ENV,
  INITIAL_TYPE_TO_EVAL,
  setEnvSourceCode,
  setTypeToEvalSourceCode,
} from "./reducer";
import { printTypeNode } from "./interpreter/TypeNode";
import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { useMemo } from "react";
import { Accordion } from "@mantine/core";

// register languages that your are planning to use
lowlight.registerLanguage("ts", tsLanguageSyntax);

function App() {
  const dispatch = useTypedDispatch();
  const typeToEval = useTypedSelector((s) => s.app.currentlyEvaledType);
  const env = useTypedSelector((s) => s.app.env);

  const trace = useMemo(() => {
    if (typeToEval && typeof env !== "string") {
      console.log("evaluating", typeToEval, env);
      return getEvalTrace(typeToEval, env);
    } else {
      return null;
    }
  }, [typeToEval, env]);

  return (
    <Stack p={32} w="100%" mih={"100vh"}>
      <Flex
        sx={{
          fontFamily: "monospace",
          fontSize: 24,
          borderBottom: "solid 2px black",
        }}
        pb={32}
      >
        walk-that-type 0.0.1
      </Flex>

      <Flex w="100%">
        <Stack w="100%">
          <Stack>
            <p>Environment editor</p>
            <CodeEditor
              initialCode={INITIAL_ENV}
              onCodeUpdate={(env) => {
                dispatch(setEnvSourceCode(env));
              }}
              errorMessage={typeof env === "string" ? env : undefined}
            />
          </Stack>
        </Stack>
        <Space w="4rem" />
        <Stack w="100%">
          <Stack>
            <p>Type to evaluate</p>
            <CodeEditor
              initialCode={INITIAL_TYPE_TO_EVAL}
              onCodeUpdate={(t) => {
                dispatch(setTypeToEvalSourceCode(t));
              }}
              errorMessage={
                !typeToEval
                  ? "ERROR: something wrong with this type"
                  : undefined
              }
            />
          </Stack>
          <Divider mb={"md"} />
          {trace && renderTrace(trace)}
        </Stack>
      </Flex>
    </Stack>
  );
}

function renderTrace(trace: EvalTrace) {
  const [initialType, ...steps] = trace;

  return (
    <Stack>
      <Prism language="typescript" noCopy>
        {printTypeNode(initialType)}
      </Prism>
      {steps.map((step) => (
        <>
          {/* <Accordion>
            <Accordion.Item value="expand">
              <Accordion.Control>Expand</Accordion.Control>
              <Accordion.Panel>{renderTrace(step.evalTrace)}</Accordion.Panel>
            </Accordion.Item>
          </Accordion> */}
          {/* <pre>{JSON.stringify(step.resultEnv, null, 2)}</pre> */}

          {step.inferMapping && Object.values(step.inferMapping).length > 0 && (
            <Stack mt={8} w="full" align="center">
              <Text>Inferred types:</Text>
              {Object.entries(step.inferMapping).map(([k, v]) => (
                <Box>
                  <Text>{`${k} -> ${printTypeNode(
                    v._type === "typeDeclaration" ? v.type : v
                  )}`}</Text>
                </Box>
              ))}
            </Stack>
          )}
          <Prism language="typescript" noCopy>
            {printTypeNode(step.result)}
          </Prism>
        </>
      ))}
    </Stack>
  );
}

export default App;

export type CodeEditorProps = {
  onCodeUpdate: (code: string) => void;
  errorMessage?: string;
  initialCode: string;
};

function CodeEditor({
  onCodeUpdate,
  errorMessage,
  initialCode,
}: CodeEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        CodeBlockLowlight.configure({
          lowlight,
          defaultLanguage: "typescript",
        }),
      ],
      content: `<pre><code>${initialCode}</code></pre>`,
      onUpdate: ({ editor, transaction }) => {
        const currentContent = transaction.doc.textContent;
        if (!transaction.doc.toString().includes("codeBlock")) {
          editor.commands.setContent(
            "<pre><code>" + currentContent + "</code></pre>"
          );
        }
        onCodeUpdate(currentContent);
      },
    },
    [initialCode]
  );

  return (
    <Stack>
      <RichTextEditor
        editor={editor}
        sx={(theme) => ({
          border: errorMessage ? `2px solid ${theme.colors.red[9]}` : "none",
        })}
        p={0}
      >
        <RichTextEditor.Content p={0} />
      </RichTextEditor>
      {errorMessage && <Text color="red.9">{errorMessage}</Text>}
    </Stack>
  );
}
