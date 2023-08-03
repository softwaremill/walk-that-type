import { Stack, Text, Code, Card, Title, Divider, Flex } from "@mantine/core";
import { EvalStep } from "../interpreter/eval-tree";
import { match, P } from "ts-pattern";
import { printTypeNode } from "../interpreter/type-node";

const DividingLine = () => (
  <Flex justify="center">
    <Divider
      color="#659ca4"
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
  return (
    <Stack w="100%" align="center">
      <DividingLine />
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title color="#35545a" order={6} mb={6}>
          {match(desc._type)
            .with("conditionalType", () => `Conditional type`)
            .with("substituteWithDefinition", () => `Definition Substitution`)
            .with("applyRestOperator", () => `Apply rest operator`)
            .exhaustive()}
        </Title>

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
                <Text color="gray.6" size={13}>
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
                  // <Code w="fit-content" key={k}>
                  //   {`${k} -> ${printTypeNode(
                  //     v._type === "typeDeclaration" ? v.type : v
                  //   )}`}
                  // </Code>
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
                <Text color="gray.6" size={13}>
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
                <Text color="gray.6" size={13}>
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
              <Text color="gray.6" size={13}>
                Substituting <Code>{name}</Code> with the definition.
              </Text>
            )
          )
          .with(
            {
              _type: "applyRestOperator",
              restElement: P.select(),
            },
            (restEl) => (
              <Text color="gray.6" size={13}>
                Applying rest operator to <Code>{printTypeNode(restEl)}</Code>.
              </Text>
            )
          )
          .exhaustive()}
      </Card>

      <DividingLine />
    </Stack>
  );
};
