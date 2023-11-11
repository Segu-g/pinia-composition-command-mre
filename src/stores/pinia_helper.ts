import {
  defineStore,
  StoreDefinition,
  Store,
  StoreGeneric,
  StateTree,
  DefineStoreOptions,
} from 'pinia';
import { ref, computed, ComputedRef, UnwrapRef, DeepReadonly } from 'vue';
import { enablePatches, enableMapSet, Immer, Patch, Objectish } from 'immer';
import { applyPatch } from 'rfc6902';

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

/**
 * Stateを直接変更できないようにdefineStateでStoreとは別にStateを定義する.
 */
export const defineState = <Id extends string, S extends StateTree>(
  option: DefineStoreOptions<Id, S, Record<never, never>, Record<never, never>>,
) => {
  const useStore = defineStore(option);
  return new StateController(option.id, useStore);
};

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

export class StateController<Id extends string, S extends StateTree> {
  public readonly id: string;
  protected readonly _useStore: StateStoreDefinition<Id, S>;
  constructor(id: Id, useStore: StateStoreDefinition<Id, S>) {
    this.id = id;
    this._useStore = useStore;
  }

  public useState(...params: Parameters<StateStoreDefinition<Id, S>>) {
    return this._useStore(...params) as StateStore<Id, DeepReadonly<S>>;
  }

  public useWritableState(...params: Parameters<StateStoreDefinition<Id, S>>) {
    return this._useStore(...params);
  }

  public defGet<Ret>(getter: GetterDefinition<S, Ret>) {
    return getter;
  }

  public defMut<Payloads extends unknown[]>(
    mutation: MutationDefinition<S, Payloads>,
  ) {
    return mutation;
  }

  public useContext() {
    const state = this.useState();
    const _writableState = state as Store<Id, S>;
    const getRef = <Ret>(
      getter: GetterDefinition<S, Ret>,
    ): ComputedRef<Ret> => {
      return computed(() => getter(state));
    };
    const mapGetRef = <
      GetterTree extends Record<string, GetterDefinition<S, unknown>>,
    >(
      getterTree: GetterTree,
    ) => mapGetterRef(state, getterTree);
    const asAct =
      <Payloads extends unknown[]>(mutation: MutationDefinition<S, Payloads>) =>
      (...payloads: Payloads) =>
        mutation(state, ...payloads);
    const mapAsAct = <
      MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
    >(
      mutationTree: MutationTree,
    ) => mapAsAction(state, mutationTree);
    return {
      state,
      _writableState,
      defGet: this.defGet,
      defMut: this.defMut,
      getRef,
      mapGetRef,
      asAct,
      mapAsAct,
    };
  }
}

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

type StateStoreDefinition<
  Id extends string,
  S extends StateTree,
> = StoreDefinition<Id, S, Record<never, never>, Record<never, never>>;
type StateStore<Id extends string, S extends StateTree> = Store<
  Id,
  S,
  Record<never, never>,
  Record<never, never>
>;
type GetterDefinition<S extends StateTree, Ret> = (state: S) => Ret;
type MutationDefinition<S extends StateTree, Payloads extends unknown[]> = (
  state: UnwrapRef<S>,
  ...payloads: Payloads
) => void;
export type MapGetterRef<
  S extends StateTree,
  GetterTree extends Record<string, GetterDefinition<S, unknown>>,
> = {
  [K in keyof GetterTree]: GetterTree[K] extends GetterDefinition<S, infer Ret>
    ? ComputedRef<Ret>
    : never;
};
export const mapGetterRef = <
  Id extends string,
  S extends StateTree,
  GetterTree extends Record<string, GetterDefinition<S, unknown>>,
>(
  state: StateStore<Id, S>,
  getterTree: GetterTree,
) => {
  return Object.fromEntries(
    Object.entries(getterTree).map(([key, getter]) => [
      key,
      computed(() => getter(state)),
    ]),
  ) as MapGetterRef<S, GetterTree>;
};
export type MapAsAction<
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
export const mapAsAction = <
  Id extends string,
  S extends StateTree,
  MutationTree extends Record<string, MutationDefinition<S, unknown[]>>,
>(
  store: StateStore<Id, S>,
  mutationTree: MutationTree,
) => {
  return Object.fromEntries(
    Object.entries(mutationTree).map(([key, mutation]) => [
      key,
      (...payloads: unknown[]) => mutation(store, payloads),
    ]),
  ) as MapAsAction<S, MutationTree>;
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
