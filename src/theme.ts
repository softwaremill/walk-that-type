import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  styles: {
    // TODO: why is this not typed?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global: (props: any) => ({
      "html, body": {
        backgroundColor:
          props.colorMode === "dark" ? "gray.700" : "hsl(210, 20%, 99%)",
      },
    }),
  },
});

export default theme;
