import { Prism, PrismTheme } from "@mantine/prism";
import { useEffect, useState } from "react";
import tsParser from "prettier/plugins/typescript";
import prettier from "prettier/standalone";
// @ts-expect-error: works 🤷‍♂️
import prettierPluginEstree from "prettier/plugins/estree";

const theme: PrismTheme = {
  plain: {
    backgroundColor: "#faf8f5",
    color: "#728fcb",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
      style: {
        color: "#b6ad9a",
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
        color: "#063289",
      },
    },
    {
      types: ["property", "function"],
      style: {
        color: "#b29762",
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
        color: "#728fcb",
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
const withoutTypeDeclaration = (code: string) =>
  code.split("type _dummy = ")[1];

export const CodeBlock = ({ code }: { code: string }) => {
  const [formattedCode, setFormattedCode] = useState<string | null>(null);
  useEffect(() => {
    prettier
      .format(withTypeDeclaration(code), {
        parser: "typescript",
        plugins: [tsParser, prettierPluginEstree],
      })
      .then((formatted) => setFormattedCode(withoutTypeDeclaration(formatted)));
  }, [code]);

  return formattedCode ? (
    <Prism
      language="typescript"
      noCopy
      radius={"md"}
      getPrismTheme={() => theme}
    >
      {formattedCode}
    </Prism>
  ) : null;
};
