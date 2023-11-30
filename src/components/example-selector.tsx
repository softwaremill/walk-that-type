import { motion, isValidMotionProp } from "framer-motion";

import {
  Flex,
  IconButton,
  Text,
  chakra,
  shouldForwardProp,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { EXAMPLES } from "../examples";
import { appState } from "../pages/App";

const AnimatedBox = chakra(motion.div, {
  shouldForwardProp: (prop) =>
    isValidMotionProp(prop) || shouldForwardProp(prop),
});

export const ExamplesSelector = () => {
  const { isOpen, onOpen, onClose } = useDisclosure({});
  const bgColor = useColorModeValue("teal.500", "teal.700");
  const textColor = useColorModeValue("gray.100", "gray.100");

  return (
    <AnimatedBox
      zIndex={2}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      display="flex"
      flexDir="column"
      position="absolute"
      animate={{ top: isOpen ? 0 : -105 }}
      initial={{ top: -105 }}
      top={0}
      w="600px"
      h="140px"
      left={0}
      right={0}
      ml="auto"
      mr="auto"
      alignItems="center"
    >
      <Flex
        p={8}
        w="100%"
        color={textColor}
        bg={bgColor}
        h="150px"
        borderBottomRadius="md"
        justify="center"
        align="center"
      >
        <Flex gap={3}>
          <Select
            value={appState.currentExampleName.use()}
            onChange={(e) => {
              const exampleName = e.target.value;
              const example = EXAMPLES.find(
                (example) => example.name === exampleName
              );

              if (example) {
                appState.envSource.set(example.envSource);
                appState.typeSource.set(example.typeSource);
                appState.currentExampleName.set(example.name);
              }
            }}
          >
            {EXAMPLES.map((example) => (
              <option key={example.name} value={example.name}>
                {example.name}
              </option>
            ))}
          </Select>
          <IconButton
            onClick={() => {
              const firstExample = EXAMPLES[0];
              appState.envSource.set(firstExample.envSource);
              appState.typeSource.set(firstExample.typeSource);
              appState.currentExampleName.set(firstExample.name);
            }}
            aria-label="reset-preset"
            icon={<RepeatIcon />}
          />
        </Flex>
      </Flex>
      <Flex
        bg={bgColor}
        w="30%"
        justify="center"
        borderBottomRadius={"md"}
        align={"flex-end"}
        p={2}
      >
        <Text fontSize={13} fontWeight="semibold" color={textColor}>
          Pick from examples ✨
        </Text>
      </Flex>
    </AnimatedBox>
  );
};
