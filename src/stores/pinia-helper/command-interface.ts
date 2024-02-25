import { DeepReadonly, UnwrapRef } from 'vue';
import { StateTree, StoreDefinition } from 'pinia';
import { Commit, StateStore } from './interface';

import { Patch } from 'immer';
import { ActionContext } from './interface';

export type CommandPatches = Record<
  string,
  {
    doPatches: Patch[];
    undoPatches: Patch[];
  }
>;

export type CommandStoreInterface = {
  $pushCommand(command: CommandPatches): void;
};

export const COMMANDABLE_STATE: unique symbol = Symbol();
export type CommandableState<
  Id extends string,
  S extends StateTree,
> = StateStore<Id, S> & {
  [COMMANDABLE_STATE]: StoreDefinition<
    Id,
    S,
    Record<never, never>,
    Record<never, never>
  >;
};

const COMMAND: unique symbol = Symbol();
export type Command<Payloads extends unknown[], Ret> = {
  [COMMAND]: CommandDefinition<Payloads, Ret>;
};
export function Command<Payloads extends unknown[], Ret>(
  command: CommandDefinition<Payloads, Ret>,
): Command<Payloads, Ret> {
  return {
    [COMMAND]: command,
  };
}
export function unwrapCommand<Payloads extends unknown[], Ret>(
  command: Command<Payloads, Ret>,
): CommandDefinition<Payloads, Ret> {
  return command[COMMAND];
}

export type CommandDispatch = <Payloads extends unknown[], Ret>(
  command: Command<Payloads, Ret>,
  ...payloads: Payloads
) => Ret;

// Command
export type CommandContext = ActionContext & {
  record: Commit;
  commandDispatch: CommandDispatch;
};
export type CommandDefinition<Payloads extends unknown[], Ret> = (
  context: CommandContext,
  ...payloads: Payloads
) => Ret;

/**
 * 単一ストアのメソッド定義用
 */
export type SingleStateCommandContext<S extends StateTree> = {
  state: DeepReadonly<UnwrapRef<S>>;
} & CommandContext;
export type SingleStateCommandDefinition<
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
> = (context: SingleStateCommandContext<S>, ...payloads: Payloads) => Ret;
export const defSingleStateCommand =
  <Id extends string, S extends StateTree>(state: StateStore<Id, S>) =>
  <Paylodas extends unknown[], Ret>(
    command: SingleStateCommandDefinition<S, Paylodas, Ret>,
  ): Command<Paylodas, Ret> => {
    return Command((ctx, ...payloads) =>
      command(
        {
          ...ctx,
          state: ctx.fetch(state),
        },
        ...payloads,
      ),
    );
  };
