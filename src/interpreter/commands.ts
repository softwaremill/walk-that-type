import { P, match } from "ts-pattern";
import { NodeId, TypeNode } from "./TypeNode";
import { Environment, lookupType } from "./environment";

export type Command = { target: NodeId } & (
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
