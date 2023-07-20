import Editor from "@uiw/react-textarea-code-editor";

export type CodeEditorProps = {
  code: string;
  onCodeUpdate: (code: string) => void;
  errorMessage?: string;
};

export const CodeEditor = ({ code, onCodeUpdate }: CodeEditorProps) => {
  return (
    <Editor
      language="typescript"
      value={code}
      onChange={(e) => onCodeUpdate(e.target.value)}
    />
  );
};
