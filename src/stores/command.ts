import {
  defineStore,
  StoreDefinition,
  Store,
  StateTree,
  DefineStoreOptions,
} from 'pinia';
import { ref, computed, UnwrapRef } from 'vue';
import { enablePatches, enableMapSet, Immer, Patch, Objectish } from 'immer';
import { applyPatch } from 'rfc6902';

import {
  StateController,
  StateStoreDefinition,
  StateStore,
  MutationDefinition,
  Action,
  Writable,
} from './pinia_helper';

enablePatches();
enableMapSet();

// immerのPatchをmutableに適応する
function applyPatchesImpl<T extends Objectish>(base: T, patches: Patch[]) {
  const operations = patches.map((patch) => ({
    op: patch.op,
    path: '/' + patch.path.reduce((prev, curr) => `${prev}/${curr}`),
    value: patch.value,
  }));
  applyPatch(base, operations);
}

const immer = new Immer();
immer.setAutoFreeze(false);

const useStateObj: Record<string, StoreDefinition> = {};
/**
 * Commandに対応したStateを持つStoreはcommandのpinia storeからアクセスするため
 * {useStateObj}にuseStoreを登録する. そのため定義はdefineCommandableStateを経由
 * させる
 */
export const defineCommandableState = <Id extends string, S extends StateTree>(
  option: DefineStoreOptions<Id, S, Record<never, never>, Record<never, never>>,
) => {
  const useStore = defineStore(option);
  useStateObj[option.id] = useStore;
  return new CommandableStateController(option.id, useStore);
};

/**
 * コマンド履歴の管理及びundo/redoを行う
 */
export const useCommand = defineStore('command', () => {
  const storeIdMap = Object.fromEntries(
    Object.entries(useStateObj).map(
      ([id, useStore]) => [id, useStore()] as const,
    ),
  );
  const stackedPatchesHistory = ref<CommandPatches[]>([]);
  const popedPatchesHistory = ref<CommandPatches[]>([]);

  const undoable = computed(() => stackedPatchesHistory.value.length !== 0);
  const redoable = computed(() => popedPatchesHistory.value.length !== 0);

  const undo = () => {
    const command = stackedPatchesHistory.value.pop();
    if (command === undefined) return;
    for (const [storeId, { undoPatches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], undoPatches);
    }
    popedPatchesHistory.value.push(command);
  };

  const redo = () => {
    const command = popedPatchesHistory.value.pop();
    if (command === undefined) return;
    for (const [storeId, { doPatches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], doPatches);
    }
    stackedPatchesHistory.value.push(command);
  };

  const $pushCommand = (command: CommandPatches) => {
    popedPatchesHistory.value = [];
    stackedPatchesHistory.value.push(command);
  };

  return {
    $pushCommand,
    undoable,
    redoable,
    undo,
    redo,
  };
});

type CommandPatches = Record<
  string,
  {
    doPatches: Patch[];
    undoPatches: Patch[];
  }
>;

export class CommandableStateController<
  Id extends string,
  S extends StateTree,
> extends StateController<Id, S> {
  constructor(id: Id, useStore: StateStoreDefinition<Id, S>) {
    super(id, useStore);
  }

  public useContext() {
    const contexts = super.useContext();
    const commandStore = useCommand();
    const defCmd = <
      MPayloads extends unknown[],
      APayloads extends unknown[],
      Ret,
    >(
      mutation: MutationDefinition<S, MPayloads>,
      action: (
        mutation: (...payloads: MPayloads) => void,
        ...payloads: APayloads
      ) => Ret,
    ) => defCommand(commandStore, contexts._writableState, mutation, action);
    const asCmd = <Payloads extends unknown[]>(
      mutation: MutationDefinition<S, Payloads>,
    ): Command<(...payloads: Payloads) => void> => ({
      dispatch: contexts.asAct(mutation),
      command: convertAsCommand(
        commandStore,
        contexts._writableState,
        mutation,
      ),
    });

    return {
      ...contexts,
      defCmd,
      asCmd,
    };
  }
}

function updateStore(store: Store, patches: Patch[]) {
  store.$patch((state: Objectish) => {
    applyPatchesImpl(state, patches);
  });
}

const convertAsCommand = <
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
>(
  commandStore: { $pushCommand(command: CommandPatches): void },
  store: StateStore<Id, S>,
  mutation: MutationDefinition<S, Payloads>,
) => {
  return (...payloads: Payloads) => {
    // Record operations
    const [, doPatches, undoPatches] = immer.produceWithPatches(
      store.$state,
      (draft) => mutation(draft as Writable<UnwrapRef<S>>, ...payloads),
    );
    // apply patches
    updateStore(store as Store, doPatches);
    commandStore.$pushCommand({
      [store.$id]: {
        doPatches: doPatches,
        undoPatches: undoPatches,
      },
    });
  };
};

export const defCommand = <
  Id extends string,
  S extends StateTree,
  MPayloads extends unknown[],
  APayloads extends unknown[],
  Ret,
>(
  commandStore: { $pushCommand(command: CommandPatches): void },
  state: StateStore<Id, S>,
  mutation: MutationDefinition<S, MPayloads>,
  action: (
    commit: (...payloads: MPayloads) => void,
    ...payloads: APayloads
  ) => Ret,
): Command<(...payloads: APayloads) => Ret> => {
  const commandFunc = convertAsCommand(commandStore, state, mutation);
  return {
    dispatch: (...payloads: APayloads) =>
      action(
        (...mpayloads: MPayloads) =>
          mutation(state as UnwrapRef<Writable<S>>, ...mpayloads),
        ...payloads,
      ),
    command: (...payloads: APayloads) => action(commandFunc, ...payloads),
  };
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type Command<A extends Function> = Action<A> & {
  command: A;
};
