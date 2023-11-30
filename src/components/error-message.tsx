import { Divider, Link, Stack, Text } from "@chakra-ui/react";

export const ErrorMessage = ({ error }: { error: string }) => (
  <Stack
    borderRadius="md"
    bg="red.500"
    borderStyle="solid"
    borderWidth={2}
    borderColor="red.600"
    p={4}
  >
    <Text color="white" fontWeight="semibold">
      {error}
    </Text>

    <Divider />

    <Text color="red.100" fontWeight="medium">
      Note that this project is still in beta and some TypeScript mechanisms can
      be still unimplemented (See {` `}
      <Link
        textDecoration="underline"
        href="https://github.com/softwaremill/walk-that-type/issues/6"
      >
        ROADMAP
      </Link>
      ).
      <br />
      If the issue is not on the Roadmap, please help us by{" "}
      <Link
        textDecoration="underline"
        href="https://github.com/softwaremill/walk-that-type/issues/new?projects=&template=bug_report.md&title="
      >
        opening an issue
      </Link>
      .
    </Text>
  </Stack>
);
