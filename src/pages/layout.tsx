import {
  Box,
  Button,
  Flex,
  IconButton,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import GitHubButton from "react-github-btn";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Stack p={6}>
      <Flex justify="space-between" align="center">
        <Flex gap={1} align="center">
          <Text
            color={colorMode === "dark" ? "gray.200" : "gray.600"}
            fontSize={18}
            as="span"
            fontWeight="regular"
          >
            Softwaremill /
          </Text>
          <Text
            color={colorMode === "dark" ? "gray.100" : "gray.600"}
            as="span"
            fontSize={18}
            fontWeight="semibold"
          >
            Walk That Type{" "}
            <Text
              color={colorMode === "dark" ? "gray.100" : "gray.600"}
              as="span"
              fontSize={18}
              fontWeight="thin"
            >
              (beta)
            </Text>
          </Text>
        </Flex>
        <Flex align="center">
          <Button
            variant="ghost"
            as="a"
            target="_blank"
            href="https://github.com/softwaremill/walk-that-type/issues/6"
          >
            Roadmap
          </Button>

          <Button
            variant="ghost"
            as="a"
            target="_blank"
            href="https://github.com/softwaremill/walk-that-type/issues/new?projects=&template=bug_report.md&title="
          >
            Report a bug
          </Button>
          <IconButton
            variant="ghost"
            colorScheme="gray"
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
      </Flex>
      <Outlet />
    </Stack>
  );
};
