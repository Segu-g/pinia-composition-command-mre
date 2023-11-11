import {
  defineStore,
  StoreDefinition,
  StoreGeneric,
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
    const asCmd = <Payloads extends unknown[]>(
      mutation: MutationDefinition<S, Payloads>,
    ) => _defineCommand(commandStore, contexts._writableState, mutation);
    const mapAsCmd = <
      MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
    >(
      mutationTree: MutationTree,
    ) => mapAsCommand(commandStore, contexts._writableState, mutationTree);
    return {
      ...contexts,
      asCmd,
      mapAsCmd,
    };
  }
}

function updateStore(store: StoreGeneric, patches: Patch[]) {
  store.$patch((state) => {
    applyPatchesImpl(state, patches);
  });
}

export const _defineCommand = <
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
      (draft) => mutation(draft as UnwrapRef<S>, ...payloads),
    );
    // apply patches
    updateStore(store, doPatches);
    commandStore.$pushCommand({
      [store.$id]: {
        doPatches: doPatches,
        undoPatches: undoPatches,
      },
    });
  };
};

export type MapAsCommand<
  S extends StateTree,
  MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
> = {
  [K in keyof MutationTree]: MutationTree[K] extends MutationDefinition<
    S,
    infer Payloads
  >
    ? (...payloads: Payloads) => void
    : never;
};
export const mapAsCommand = <
  Id extends string,
  S extends StateTree,
  MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
>(
  commandStore: { $pushCommand(command: CommandPatches): void },
  state: StateStore<Id, S>,
  mutationTree: MutationTree,
) => {
  return Object.fromEntries(
    Object.entries(mutationTree).map(([key, mutation]) => [
      key,
      _defineCommand(commandStore, state, mutation),
    ]),
  ) as MapAsCommand<S, MutationTree>;
};
