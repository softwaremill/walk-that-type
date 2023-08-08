import { expect } from "vitest";
import type { TypeNode } from "../interpreter/type-node";
import { deepEquals } from "../interpreter/extends-type";

expect.extend({
  equalsTypeNode(received: TypeNode, expected: TypeNode) {
    const { isNot, utils } = this;

    return {
      pass: deepEquals(received, expected),
      message: () =>
        `${utils.printReceived(received)} is${
          isNot ? " not" : ""
        } ${utils.printExpected(expected)}`,
    };
  },
});
