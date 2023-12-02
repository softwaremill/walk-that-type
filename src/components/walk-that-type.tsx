import { P, match } from "ts-pattern";
import { EvalStep, EvalTrace } from "../interpreter/eval-tree";
import { Button, Code, Flex, Stack, Text } from "@chakra-ui/react";
import { CodeBlock } from "./code-block";
import { printTypeNode } from "../interpreter/type-node";
import { useEffect, useState } from "react";
import { DividingLine, EvalDescription } from "./eval-description";

type WalkThatTypeProps = {
  trace: EvalTrace;
};

export const WalkThatType = ({ trace }: WalkThatTypeProps) => {
  const [initialType, ...steps] = trace;

  return (
    <Stack w="full" align="center">
      <CodeBlock code={printTypeNode(initialType)} />
      <WalkThatTypeNextStep steps={steps} />
    </Stack>
  );
};

const WalkThatTypeNextStep = ({ steps }: { steps: EvalStep[] }) => {
  const [currentStep, ...nextSteps] = steps;
  const [state, setState] = useState<"choice" | "step-over" | "step-into">(
    "choice"
  );

  useEffect(() => {
    setState("choice");
  }, [steps]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      <Stack w="full">
        <EvalDescription
          desc={currentStep.evalDescription}
          {...(state === "step-over"
            ? { expandable: true, onExpand: () => setState("step-into") }
            : { expandable: false })}
        />
      </Stack>
      {match([currentStep.evalDescription, state])
        .with([{ _type: "substituteWithDefinition" }, "choice"], () => (
          <Flex gap={6} justify="center">
            <Button
              onClick={() => setState("step-over")}
              colorScheme="blue"
              variant="outline"
            >
              Step over
            </Button>

            <Button onClick={() => setState("step-into")} colorScheme="teal">
              Step into
            </Button>
          </Flex>
        ))
        .with([{ _type: "substituteWithDefinition" }, "step-over"], () => (
          <>
            <CodeBlock code={printTypeNode(currentStep.result)} />
            <WalkThatTypeNextStep steps={nextSteps} />
          </>
        ))
        .with(
          [
            P.shape({ _type: "substituteWithDefinition" }).select(),
            "step-into",
          ],
          (evalDescription) => (
            <>
              <Stack
                w="full"
                p={6}
                pb={12}
                borderStyle="solid"
                borderWidth={2}
                borderColor="gray.300"
                borderRadius={6}
                position="relative"
              >
                <Text fontSize={12} color="gray.500" mb={2}>
                  Evaluating: <Code fontSize={12}>{evalDescription.name}</Code>
                </Text>
                <Button
                  size={"sm"}
                  position={"absolute"}
                  bottom={2}
                  right={2}
                  variant="ghost"
                  colorScheme="teal"
                  onClick={() => setState("step-over")}
                >
                  Collapse
                </Button>
                <WalkThatType trace={evalDescription.evalTrace} />
              </Stack>
              <Flex w="full" justify="center">
                <DividingLine />
              </Flex>
              <CodeBlock code={printTypeNode(currentStep.result)} />
              <WalkThatTypeNextStep steps={nextSteps} />
            </>
          )
        )
        .otherwise(() => (
          <>
            <CodeBlock code={printTypeNode(currentStep.result)} />
            <WalkThatTypeNextStep steps={nextSteps} />
          </>
        ))}
    </>
  );
};
