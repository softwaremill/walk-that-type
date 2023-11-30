import {
  Button,
  Flex,
  Image,
  Show,
  SimpleGrid,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

export const LandingPage = () => {
  const { colorMode } = useColorMode();

  return (
    <Stack mt={8}>
      <SimpleGrid columns={{ sm: 1, lg: 2 }} spacing={8}>
        <Stack>
          <Text
            mb={6}
            fontWeight="black"
            fontSize={[48, 64]}
            maxW="64rem"
            lineHeight={1.1}
          >
            Evaluate TypeScript types step by step!
          </Text>

          <Text
            fontSize={18}
            color={colorMode === "light" ? "gray.600" : "gray.300"}
          >
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Minima,
            nostrum dolores veritatis odio illum aliquid consequuntur hic harum
            deserunt at perspiciatis quasi eum sequi excepturi explicabo quis
            cupiditate neque vel!
          </Text>

          <Flex gap={4} mt={2}>
            <Button to="/app" as={Link} size="lg" colorScheme="teal">
              Start exploring
            </Button>
            <Button
              to="https://github.com/softwaremill/walk-that-type"
              as={Link}
              size="lg"
            >
              See on GitHub
            </Button>
          </Flex>
        </Stack>

        <Show above="lg">
          <Stack>
            <Image
              src="/walk-that-type-landing.gif"
              alt="code-gif"
              borderRadius="md"
            />
          </Stack>
        </Show>
      </SimpleGrid>

      <Flex mt={10}>
        <Text
          fontSize={24}
          fontWeight="black"
          color={colorMode === "light" ? "gray.600" : "gray.200"}
        >
          Use cases ✨
        </Text>
      </Flex>

      <Flex mt={4} flexWrap="wrap" gap={8}>
        <UseCase
          title="Get better at type-level programming 💪🏻"
          description="
        Walk That Type is a tool that helps you understand how TypeScript types work. Paste any type into it and explore how it works step by step to gain insights into type-level mechanics.
        "
        />
        <UseCase
          title="Debug your types 🧐"
          description="
          Does your type not work as expected? Define your test cases and step through it to see what's wrong.
        "
        />
        <UseCase
          title="Craft advanced types 🤓"
          description="
        You can use Walk That Type's built-in editor to craft and test your types. The project is still in beta, so not all TS features are supported, but one day WTT could be like a storybook for types.
        "
        />
      </Flex>
    </Stack>
  );
};

function UseCase({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { colorMode } = useColorMode();
  return (
    <Stack
      minW={"sm"}
      maxW="sm"
      border="solid 1px"
      borderColor="gray.600"
      borderRadius="md"
      p={4}
    >
      <Text
        fontSize={18}
        fontWeight="semibold"
        color={colorMode === "light" ? "gray.600" : "gray.200"}
      >
        {title}
      </Text>
      <Text
        fontSize={16}
        color={colorMode === "light" ? "gray.500" : "gray.400"}
        fontWeight="medium"
      >
        {description}
      </Text>
    </Stack>
  );
}
