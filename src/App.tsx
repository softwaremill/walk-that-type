import { Divider, Flex, Grid, Stack, Text, Title } from "@mantine/core";

import { lowlight } from "lowlight";
import tsLanguageSyntax from "highlight.js/lib/languages/typescript";

import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { useTypedDispatch, useTypedSelector } from "./store";
import {
  INITIAL_ENV,
  INITIAL_TYPE_TO_EVAL,
  setEnvSourceCode,
  setTypeToEvalSourceCode,
} from "./reducer";
import { printTypeNode } from "./interpreter/TypeNode";
import { EvalTrace, getEvalTrace } from "./interpreter/eval-tree";
import { Fragment, useMemo } from "react";
// import { Accordion } from "@mantine/core";
import { CodeBlock } from "./components/CodeBlock";
import { EvalDescription } from "./components/EvalDescription";

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
              initialCode={INITIAL_ENV}
              onCodeUpdate={(env) => {
                dispatch(setEnvSourceCode(env));
              }}
              errorMessage={typeof env === "string" ? env : undefined}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={6} mah="85vh">
          <Stack mah="100%" px={6}>
            <Stack>
              <Title color="#35545a" order={3}>
                Type to evaluate
              </Title>
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

            <Divider color="#b2cdd2" mb={"md"} />

            <Stack mah="100%" sx={{ overflowY: "auto" }}>
              {trace && renderTrace(trace)}
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
}

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
