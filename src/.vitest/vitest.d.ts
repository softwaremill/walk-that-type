import type { Assertion, AsymmetricMatchersContaining } from "vitest";
import { TypeNode } from "../interpreter/type-node";

interface CustomMatchers<R = unknown> {
  equalsTypeNode(t: TypeNode): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
