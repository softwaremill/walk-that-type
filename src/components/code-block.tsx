import { Prism, PrismTheme } from "@mantine/prism";
import { useEffect, useState } from "react";
import { formatCode } from "../utils/formatCode";

const theme: PrismTheme = {
  plain: {
    backgroundColor: "rgba(8, 2, 2, 0.87)",
    color: "#e4f0fb",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
      style: {
        color: "#767c9d",
      },
    },
    {
      types: ["namespace"],
      style: {
        opacity: 0.7,
      },
    },
    {
      types: ["tag", "operator", "number"],
      style: {
        color: "#5DE4c7",
      },
    },
    {
      types: ["property", "function"],
      style: {
        color: "#e4f0fb",
      },
    },
    {
      types: ["tag-id", "selector", "atrule-id"],
      style: {
        color: "#2d2006",
      },
    },
    {
      types: ["attr-name"],
      style: {
        color: "#896724",
      },
    },
    {
      types: [
        "boolean",
        "string",
        "entity",
        "url",
        "attr-value",
        "keyword",
        "control",
        "directive",
        "unit",
        "statement",
        "regex",
        "atrule",
      ],
      style: {
        color: "palevioletred",
      },
    },
    {
      types: ["placeholder", "variable"],
      style: {
        color: "#93abdc",
      },
    },
    {
      types: ["deleted"],
      style: {
        textDecorationLine: "line-through",
      },
    },
    {
      types: ["inserted"],
      style: {
        textDecorationLine: "underline",
      },
    },
    {
      types: ["italic"],
      style: {
        fontStyle: "italic",
      },
    },
    {
      types: ["important", "bold"],
      style: {
        fontWeight: "bold",
      },
    },
    {
      types: ["important"],
      style: {
        color: "#896724",
      },
    },
  ],
};

const withTypeDeclaration = (code: string) => `type _dummy = ${code}`;
const withoutTypeDeclaration = (code: string) => code.split("type _dummy =")[1];

export const CodeBlock = ({ code }: { code: string }) => {
  const [formattedCode, setFormattedCode] = useState<string | null>(null);
  useEffect(() => {
    formatCode(withTypeDeclaration(code))
      .then((formatted) => {
        return setFormattedCode(withoutTypeDeclaration(formatted));
      })
      .catch((e) => {
        console.error(e);
        setFormattedCode(code);
      });
  }, [code]);

  return formattedCode ? (
    <Prism
      language="typescript"
      noCopy
      radius={"md"}
      sx={{ boxShadow: "0px 6px 12px -6px rgba(0, 0, 0, 0.1)" }}
      styles={{ code: { fontSize: 14, fontFamily: "'Fira Code', monospace" } }}
      getPrismTheme={() => theme}
    >
      {formattedCode}
    </Prism>
  ) : null;
};
