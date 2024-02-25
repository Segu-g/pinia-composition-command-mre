import { UnwrapRef } from 'vue';
import { StateTree } from 'pinia';
import {
  unwrapMutation,
  Fetch,
  Commit,
  USE_STATE,
  Mutation,
  MutationContext,
  StateStore,
} from './interface';
import {
  CommandableState,
  CommandDispatch,
  Command,
  CommandContext,
  CommandStoreInterface,
  unwrapCommand,
  COMMANDABLE_STATE,
  CommandPatches,
} from './command-interface';
import {
  templateReadonlyFetch,
  templateGet,
  templateCommit,
  templateDispatch,
  StateStoreExecContext,
} from './execution';
import { immer } from './immer';
import { PatchListener, isDraft } from 'immer';

type CommandStateStoreExecContext = StateStoreExecContext & {
  command: CommandDispatch;
};
export function useStateStore(
  history: CommandStoreInterface,
): CommandStateStoreExecContext {
  return {
    fetch: (state) => state[USE_STATE](),
    get: templateGet({}),
    dispatch: templateDispatch({}),
    command: templateCommandDispatch(history),
  };
}

// command内でのfetchはcommitで参照されるstateをdraftに差し替える
export function templateCommandFetch(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): Fetch {
  return function fetch<Id extends string, S extends StateTree>(
    state: StateStore<Id, S> | CommandableState<Id, S>,
  ): UnwrapRef<S> {
    if (!(state[USE_STATE].$id in stateMap)) {
      if (COMMANDABLE_STATE in state) {
        stateMap[state[COMMANDABLE_STATE].$id] = immer.createDraft(
          state[COMMANDABLE_STATE]().$state,
        );
      } else {
        stateMap[state[USE_STATE].$id] = state[USE_STATE]();
      }
    }
    return stateMap[state[USE_STATE].$id] as UnwrapRef<S>;
  };
}

export function templateCommandCommit(
  stateMap: Record<string, UnwrapRef<StateTree>>,
): Commit {
  return function commit<Payloads extends unknown[]>(
    mutation: Mutation<Payloads>,
    ...payloads: Payloads
  ) {
    const ctx: MutationContext = {
      fetch: templateCommandFetch(stateMap),
      get: templateGet(stateMap),
      commit: commit,
    };
    return unwrapMutation(mutation)(ctx, ...payloads);
  };
}

export function templateCommand(history: CommandStoreInterface): Commit {
  const stateMap = {};
  return function command<Payloads extends unknown[]>(
    mutation: Mutation<Payloads>,
    ...payloads: Payloads
  ) {
    const ctx: MutationContext = {
      fetch: templateCommandFetch(stateMap),
      get: templateGet(stateMap),
      commit: templateCommandCommit(stateMap),
    };
    unwrapMutation(mutation)(ctx, ...payloads);
    const commandPatches: CommandPatches = {};
    const makePatchListener =
      (id: string): PatchListener =>
      (patches, inversePatches) => {
        commandPatches[id].doPatches.push(...patches);
        commandPatches[id].undoPatches.push(...inversePatches);
      };
    for (const [id, state] of Object.entries(stateMap)) {
      if (isDraft(state)) {
        commandPatches[id] = { doPatches: [], undoPatches: [] };
        immer.finishDraft(state, makePatchListener(id));
      }
    }
    history.$pushCommand(commandPatches);
  };
}

export function templateCommandDispatch(
  history: CommandStoreInterface,
  stateMap: Record<string, UnwrapRef<StateTree>> = {},
): CommandDispatch {
  return function commandDispatch<Payloads extends unknown[], Ret>(
    command: Command<Payloads, Ret>,
    ...payloads: Payloads
  ) {
    const ctx: CommandContext = {
      fetch: templateReadonlyFetch(stateMap),
      get: templateGet(stateMap),
      commit: templateCommit(stateMap),
      dispatch: templateDispatch(stateMap),
      record: templateCommand(history),
      commandDispatch: commandDispatch,
    };
    return unwrapCommand(command)(ctx, ...payloads);
  };
}
