import { EvalStep } from "../interpreter/eval-tree";
import { match, P } from "ts-pattern";
import { printTypeNode } from "../interpreter/type-node";
import {
  Button,
  Code,
  Divider,
  Flex,
  Stack,
  StackProps,
  Text,
  useColorMode,
} from "@chakra-ui/react";

export const DividingLine = () => (
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

const Card = (props: StackProps) => {
  const { colorMode } = useColorMode();

  return (
    <Stack
      p={4}
      shadow="sm"
      borderRadius="md"
      borderStyle="solid"
      borderWidth={1}
      borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
      backgroundColor={colorMode === "light" ? "white" : "gray.800"}
      position="relative"
      {...props}
    />
  );
};

const DistantCards = () => (
  <>
    <Card
      zIndex={3}
      w="full"
      h="full"
      position="absolute"
      top="2px"
      left="2px"
      bg="#e2e2e2"
      border="none"
    />
    <Card
      zIndex={2}
      w="full"
      h="full"
      position="absolute"
      top="4px"
      left="4px"
      bg="#e0e0e0"
      border="none"
    />
    <Card
      zIndex={1}
      w="full"
      h="full"
      position="absolute"
      top="6px"
      left="6px"
      bg="#d6d6d6"
      border="none"
    />
  </>
);

export type EvalDescriptionProps = {
  desc: EvalStep["evalDescription"];
} & (
  | { expandable: true; onExpand: () => void }
  | { expandable?: false; onExpand?: () => void }
);

export const EvalDescription = ({
  desc,
  expandable,
  onExpand,
}: EvalDescriptionProps) => {
  return (
    <Stack w="100%" align="center" pb={2}>
      <DividingLine />
      <Stack position="relative">
        {expandable && (
          <>
            <DistantCards />
            <Button
              size="sm"
              colorScheme="teal"
              variant="ghost"
              position="absolute"
              bottom={-10}
              right={0}
              onClick={onExpand}
            >
              Expand
            </Button>
          </>
        )}
        <Card zIndex={4}>
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
                    <Text key={k}>
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
                    <Code>{typeName}</Code>'s argument is a union type and it
                    can be distributed, so <Code>{typeName}</Code> is applied to
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
                  Applying rest operator to <Code>{printTypeNode(restEl)}</Code>
                  .
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
        </Card>
      </Stack>

      <DividingLine />
    </Stack>
  );
};
