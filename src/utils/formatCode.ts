import tsParser from "prettier/plugins/typescript";
import prettier from "prettier/standalone";
// @ts-expect-error: works 🤷‍♂️
import prettierPluginEstree from "prettier/plugins/estree";

export const formatCode = (code: string) =>
  prettier.format(code, {
    parser: "typescript",
    plugins: [tsParser, prettierPluginEstree],
  });
