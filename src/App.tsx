import { Flex, Stack, Text } from "@mantine/core";
import { Prism } from "@mantine/prism";

import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import tsLanguageSyntax from "highlight.js/lib/languages/typescript";
import { useTypedDispatch, useTypedSelector } from "./store";
import {
  selectAvailableCommands,
  setEnvSourceCode,
  setTypeToEvalSourceCode,
} from "./reducer";

// register languages that your are planning to use
lowlight.registerLanguage("ts", tsLanguageSyntax);

const INITIAL_ENV =
  "type First<T extends any[]> = T extends [infer H, ...any[]] ? H : never;";
const INITIAL_TYPE_TO_EVAL = "First<[1, 2, 3]>";

function App() {
  const dispatch = useTypedDispatch();
  const typeToEval = useTypedSelector((s) => s.app.currentlyEvaledType);
  const env = useTypedSelector((s) => s.app.env);
  const commands = useTypedSelector(selectAvailableCommands);

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
        </Stack>

        <Stack w="100%">
          <Prism language="typescript" noCopy>
            {typeToEval == null ? "" : typeToEval.text}
          </Prism>
          {commands.map((c) => (
            <Flex key={c.target}>
              <Text>{JSON.stringify(c._command)}</Text>
            </Flex>
          ))}
        </Stack>
      </Flex>
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
