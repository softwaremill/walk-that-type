import { Accordion, Stack } from "@mantine/core";
import { EvalTrace } from "../interpreter/eval-tree";
import { CodeBlock } from "./CodeBlock";
import { Fragment } from "react";
import { EvalDescription } from "./EvalDescription";
import { printTypeNode } from "../interpreter/type-node";

export function renderTrace(trace: EvalTrace) {
  const [initialType, ...steps] = trace;
  return (
    <Stack mah="100%">
      <CodeBlock code={printTypeNode(initialType)} />
      {steps.map((step, idx) => (
        <Fragment key={`${step.result.nodeId}-${idx}`}>
          <EvalDescription desc={step.evalDescription} />
          {step.evalDescription._type === "substituteWithDefinition" && (
            <Accordion>
              <Accordion.Item value="expand">
                <Accordion.Control>Step into evaluation</Accordion.Control>
                <Accordion.Panel>
                  {renderTrace(step.evalDescription.evalTrace)}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}

          <CodeBlock code={printTypeNode(step.result)} />
        </Fragment>
      ))}
    </Stack>
  );
}
