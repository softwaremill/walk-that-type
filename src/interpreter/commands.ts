import { P, match } from "ts-pattern";
import { NodeId, TypeNode, updateTypeNode } from "./TypeNode";
import {
  Environment,
  addToEnvironment,
  extendEnvironment,
  lookupType,
} from "./environment";
import { evalType } from "./eval";
import { extendsType } from "./extendsType";

export type Command = { target: NodeId; text: string } & (
  | { _command: "replaceWithDefinition" }
  | { _command: "simplifyUnion" }
  | { _command: "evaluateConditionalType" }
  | { _command: "applyRest" }
);

type EvalContext = {
  isInExtendsType: boolean;
};

const addCommand = (
  commands: Record<NodeId, Command>,
  command: Command
): Record<NodeId, Command> => ({
  ...commands,
  [command.target]: command,
});

const mergeCommands = (
  ...commands: Record<NodeId, Command>[]
): Record<NodeId, Command> =>
  commands.reduce((acc, c) => ({ ...acc, ...c }), {});

export const findAvailableCommands = (
  env: Environment,
  type: TypeNode,
  commands: Record<NodeId, Command> = {},
  ctx?: EvalContext
): Record<NodeId, Command> =>
  match(type)
    .with(
      {
        _type: P.union(
          "booleanLiteral",
          "stringLiteral",
          "numberLiteral",
          "number",
          "string",
          "boolean",
          "null",
          "undefined",
          "void",
          "any",
          "unknown",
          "never",
          "infer",
          "rest"
        ),
      },
      () => commands
    )
    .with({ _type: "typeReference" }, (t) => {
      const doesExist = lookupType(env, t.name).isSome;
      const cmds = doesExist
        ? addCommand(commands, {
            target: t.nodeId,
            _command: "replaceWithDefinition",
            text: t.text(),
          })
        : {};

      return mergeCommands(
        cmds,
        ...t.typeArguments.map((tt) =>
          findAvailableCommands(env, tt, cmds, ctx)
        )
      );
    })
    .with({ _type: "tuple" }, (t) => {
      const isInExtendsType = ctx?.isInExtendsType ?? false;
      if (!isInExtendsType) {
        t.elements.forEach((tt) => {
          if (tt._type === "rest") {
            addCommand(commands, {
              target: tt.nodeId,
              _command: "applyRest",
              text: t.text(),
            });
          }
        });
      }
      return mergeCommands(
        ...t.elements.map((tt) => findAvailableCommands(env, tt, commands, ctx))
      );
    })
    .with({ _type: "array" }, (t) =>
      findAvailableCommands(env, t.elementType, commands, ctx)
    )
    .with({ _type: "conditionalType" }, (t) => {
      const cmds = addCommand(commands, {
        target: t.nodeId,
        _command: "evaluateConditionalType",
        text: t.text(),
      });

      return mergeCommands(
        cmds,
        findAvailableCommands(env, t.checkType, cmds, ctx),
        findAvailableCommands(env, t.extendsType, cmds, {
          isInExtendsType: true,
        }),
        findAvailableCommands(env, t.thenType, cmds, ctx),
        findAvailableCommands(env, t.elseType, cmds, ctx)
      );
    })
    .with({ _type: P.union("union", "intersection") }, () => {
      throw new Error("not implemented");
    })
    .with({ _type: "typeDeclaration" }, () => {
      throw new Error("Type declaration shouldn't be in type to be evaluated");
    })
    .exhaustive();

// modifies the type in place
// FIXME: this code is trash, but it's just for a PoC
export const executeCommand = (
  env: Environment,
  t: TypeNode,
  c: Command
): [TypeNode, Environment] => {
  return updateTypeNode(t, c.target, (tt) => {
    switch (c._command) {
      case "replaceWithDefinition": {
        if (tt._type !== "typeReference") {
          throw new Error(
            "replaceWithDefinition: innerT._type !== typeReference"
          );
        }
        const typeDeclaration = env[tt.name];

        if (!typeDeclaration) {
          throw new Error(`Unknown type ${tt.name}`);
        }

        const newEnv = { ...env };
        typeDeclaration.typeParameters.forEach((ty, idx) => {
          addToEnvironment(newEnv, ty, tt.typeArguments[idx]);
        });

        // multipleReplaceByDef(
        //   typeDeclaration.type,
        //   newEnv,
        //   typeDeclaration.typeParameters
        // );

        return [typeDeclaration.type, newEnv];
      }
      case "simplifyUnion": {
        throw new Error("not implemented");
      }
      case "evaluateConditionalType": {
        if (tt._type !== "conditionalType") {
          throw new Error(
            "evaluateConditionalType: innerT._type !== conditionalType"
          );
        }

        const lhs = evalType(env, tt.checkType).unwrap();
        const rhs = evalType(env, tt.extendsType).unwrap();

        const result = extendsType(env, lhs, rhs);

        const evaluatedThenType = result.extends ? tt.thenType : tt.elseType;

        // multipleReplaceByDef(
        //   evaluatedThenType,
        //   extendEnvironment(env, result.inferredTypes),
        //   Object.keys(result.inferredTypes)
        // );

        return [
          evaluatedThenType,
          extendEnvironment(env, result.inferredTypes),
        ];
      }
      case "applyRest": {
        throw new Error("not implemented");
      }
    }
  });
};
