import { EvalStep } from "../interpreter/eval-tree";
import { match, P } from "ts-pattern";
import { printTypeNode } from "../interpreter/type-node";
import {
  Code,
  Divider,
  Flex,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";

const DividingLine = () => (
  <Flex justify="center">
    <Divider
      borderColor="#659ca4"
      variant="dashed"
      orientation="vertical"
      h="1.5rem"
      w="100%"
    />
  </Flex>
);

export const EvalDescription = ({
  desc,
}: {
  desc: EvalStep["evalDescription"];
}) => {
  const { colorMode } = useColorMode();

  return (
    <Stack w="100%" align="center">
      <DividingLine />
      <Stack
        p={4}
        shadow="sm"
        borderRadius="md"
        borderStyle="solid"
        borderWidth={1}
        borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
        backgroundColor={colorMode === "light" ? "white" : "gray.800"}
      >
        <Text as="h6" fontWeight="semibold">
          {match(desc._type)
            .with("conditionalType", () => "Conditional type")
            .with("substituteWithDefinition", () => "Definition Substitution")
            .with("applyRestOperator", () => "Apply rest operator")
            .with("simplifyUnion", () => "Simplify union type")
            .with("useIntrinsicType", () => "Intrinsic type")
            .with("distributiveUnion", () => "Distribute over union")
            .with("mappedType", () => "Mapped type")
            .with("indexedAccessType", () => "Indexed Access Types")
            .with("keyof", () => "keyof operator")
            .exhaustive()}
        </Text>

        {match(desc)
          .with(
            {
              _type: "conditionalType",
              extends: true,
              checkType: P.select("checkType"),
              extendsType: P.select("extendsType"),
              inferredTypes: P.not(P.nullish).select("inferredTypes"),
            },
            ({ inferredTypes, checkType, extendsType }) => (
              <Stack>
                <Text color="gray.4" fontSize={13}>
                  <Code>{printTypeNode(checkType)}</Code> extends{" "}
                  <Code>{printTypeNode(extendsType)}</Code> with the following
                  inferred types:
                </Text>
                {Object.entries(inferredTypes).map(([k, v]) => (
                  <Text>
                    <Code sx={{ color: "black" }} mr={6}>
                      {k}
                    </Code>{" "}
                    {`➡️`}
                    <Code ml={6}>
                      {printTypeNode(
                        v._type === "typeDeclaration" ? v.type : v
                      )}
                    </Code>
                  </Text>
                ))}
              </Stack>
            )
          )
          .with(
            {
              _type: "conditionalType",
              extends: true,
              checkType: P.select("checkType"),
              extendsType: P.select("extendsType"),
            },
            ({ extendsType, checkType }) => (
              <Stack>
                <Text color="gray.4" fontSize={13}>
                  <Code>{printTypeNode(checkType)}</Code> extends{" "}
                  <Code>{printTypeNode(extendsType)}</Code>
                </Text>
              </Stack>
            )
          )
          .with(
            {
              _type: "conditionalType",
              extends: false,
              checkType: P.select("checkType"),
              extendsType: P.select("extendsType"),
            },
            ({ checkType, extendsType }) => (
              <Stack>
                <Text color="gray.4" fontSize={13}>
                  <Code>{printTypeNode(checkType)}</Code> doesn't extend{" "}
                  <Code>{printTypeNode(extendsType)}</Code>
                </Text>
              </Stack>
            )
          )
          .with(
            {
              _type: "substituteWithDefinition",
              name: P.select(),
            },
            (name) => (
              <Text color="gray.4" fontSize={13}>
                Substituting <Code>{name}</Code> with the definition.
              </Text>
            )
          )
          .with(
            {
              _type: "useIntrinsicType",
              text: P.select("text"),
              docsUrl: P.select("docsUrl"),
            },
            ({ text, docsUrl }) => (
              <>
                <Text color="gray.4" fontSize={13}>
                  Applying built-in type <Code>{text}</Code>.
                </Text>
                <Text color="gray.4" fontSize={13}>
                  Learn more about it{" "}
                  <Text
                    fontSize={13}
                    as="a"
                    textDecoration="underline"
                    target="_blank"
                    href={docsUrl}
                  >
                    here
                  </Text>
                  .
                </Text>
              </>
            )
          )
          .with(
            {
              _type: "distributiveUnion",
              typeName: P.select("typeName"),
            },
            ({ typeName }) => (
              <>
                <Text color="gray.4" fontSize={13}>
                  <Code>{typeName}</Code>'s argument is a union type and it can
                  be distributed, i.e. <Code>{typeName}</Code> is applied to
                  each union member.
                </Text>
                <Text color="gray.4" fontSize={13}>
                  Learn more about it{" "}
                  <Text
                    fontSize={13}
                    as="a"
                    textDecoration="underline"
                    target="_blank"
                    href={
                      "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types"
                    }
                  >
                    here
                  </Text>
                  .
                </Text>
              </>
            )
          )
          .with(
            {
              _type: "applyRestOperator",
              restElement: P.select(),
            },
            (restEl) => (
              <Text color="gray.4" fontSize={13}>
                Applying rest operator to <Code>{printTypeNode(restEl)}</Code>.
              </Text>
            )
          )
          .with(
            {
              _type: "simplifyUnion",
              union: P.select(),
            },
            (unionEl) => (
              <Text color="gray.4" fontSize={13}>
                Simplifying the union <Code>{printTypeNode(unionEl)}</Code>.
              </Text>
            )
          )
          .with(
            {
              _type: "mappedType",
            },
            () => (
              <Text color="gray.4" fontSize={13}>
                Simplifying the mapped type.
              </Text>
            )
          )
          .with(
            {
              _type: "indexedAccessType",
            },
            () => (
              <Text color="gray.4" fontSize={13}>
                Accessing type property.
              </Text>
            )
          )
          .with(
            {
              _type: "keyof",
            },
            () => (
              <Text color="gray.6" fontSize={13}>
                Applying <Code>keyof</Code> operator.
              </Text>
            )
          )
          .exhaustive()}
      </Stack>

      <DividingLine />
    </Stack>
  );
};
