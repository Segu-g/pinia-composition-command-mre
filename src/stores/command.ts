import {
  defineStore,
  StoreDefinition,
  Store,
  StateTree,
  DefineStoreOptions,
} from 'pinia';
import { ref, computed, UnwrapRef, DeepReadonly } from 'vue';
import { enablePatches, enableMapSet, Immer, Patch, Objectish } from 'immer';
// immerの内部関数であるgetPlugin("Patches").applyPatches_はexportされていないので
// ビルド前のsrcからソースコードを読み込んで使う必要がある
import { enablePatches as enablePatchesImpl } from 'immer/src/plugins/patches';
import { enableMapSet as enableMapSetImpl } from 'immer/src/plugins/mapset';
import { getPlugin } from 'immer/src/utils/plugins';

import {
  StateController,
  useController,
  StateStore,
  StateStoreDefinition,
  MutationDefinition,
  Get,
  Commit,
  Dispatch,
  Action,
  STORE_TAG,
ActionContext,
} from './pinia_helper';

// ビルド後のモジュールとビルド前のモジュールは別のスコープで変数を持っているので
// enable * も両方叩く必要がある。
enablePatches();
enableMapSet();
enablePatchesImpl();
enableMapSetImpl();
// immerのPatchをmutableに適応する内部関数
const applyPatchesImpl = getPlugin('Patches').applyPatches_;

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
  const poppedPatchesHistory = ref<CommandPatches[]>([]);

  const undoable = computed(() => stackedPatchesHistory.value.length !== 0);
  const redoable = computed(() => poppedPatchesHistory.value.length !== 0);

  const undo = () => {
    const command = stackedPatchesHistory.value.pop();
    if (command === undefined) return;
    for (const [storeId, { undoPatches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], undoPatches);
    }
    poppedPatchesHistory.value.push(command);
  };

  const redo = () => {
    const command = poppedPatchesHistory.value.pop();
    if (command === undefined) return;
    for (const [storeId, { doPatches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], doPatches);
    }
    stackedPatchesHistory.value.push(command);
  };

  const $pushCommand = (command: CommandPatches) => {
    poppedPatchesHistory.value = [];
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

  public useControllerContext(...args: Parameters<StoreDefinition>) {
    const contexts = super.useControllerContext(...args);
    const commandStore = useCommand(...args);
    const { dispatch } = useController();
    const defCmd = <Payloads extends unknown[], Ret>(
      commandDef: CommandDefinition<Id, S, Payloads, Ret>,
    ): Command<Id, S, Payloads, Ret> => ({
      [COMMAND_TAG]: commandDef,
      [STORE_TAG]: contexts._store,
      [COMMAND_STORE_TAG]: commandStore
    });
    function convertToCommandContext<Id extends string, S extends StateTree>(
        actionCtx: ActionContext<Id, S>,
    ): CommandContext<Id, S> {
        return {
            ...actionCtx,
            recordCommit: actionCtx.commit,
            commandDispatch: <
            Id_ extends string,
            S_ extends StateTree,
            Payloads_ extends unknown[],
            Ret_,
        >(
        command: Command<Id_, S_, Payloads_, Ret_>,
        ...payloads: Payloads_
        ) => command[COMMAND_TAG](convertToCommandContext(actionCtx), ...payloads)
        }
    } 
    function invalidateRecord<Payloads extends unknown[], Ret>(command: Command<Id, S, Payloads, Ret>): Action<Id, S, Payloads, Ret> {
        const commandDef = command[COMMAND_STORE_TAG];
        const actionDef = contexts.defAct<Payloads, Ret>((ctx, ...payloads) => {
            const cmdCtx: CommandContext<Id, S> = {
                ...ctx,
                recordCommit: ctx.commit,
                commandDispatch: 
            }
            return commandDef();
        })
    }

    return {
      ...contexts,
      defCmd,
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
  commandStore: CommandStoreInterface,
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

// symbol for hiding
export const COMMAND_TAG: unique symbol = Symbol();
export const COMMAND_STORE_TAG: unique symbol = Symbol();

// Context function
export type CommandDispatch = <
    Id extends string,
    S extends StateTree,
    Payloads extends unknown[],
    Ret,
>(
command: Command<Id, S, Payloads, Ret>,
...payloads: Payloads
) => Ret;

// Command
export type CommandContext<Id extends string, S extends StateTree> = {
  state: DeepReadonly<UnwrapRef<S>>;
  get: Get<Id, S>;
  commit: Commit<Id, S>;
  recordCommit: Commit<Id, S>;
  dispatch: Dispatch;
  commandDispatch: CommandDispatch;
};
export type CommandDefinition<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
> = (context: CommandContext<Id, S>, ...payloads: Payloads) => Ret;
export type Command<
  Id extends string,
  S extends StateTree,
  Payloads extends unknown[],
  Ret,
> = {
  [COMMAND_TAG]: CommandDefinition<Id, S, Payloads, Ret>;
  [STORE_TAG]: Store<Id, S>;
  [COMMAND_STORE_TAG]: 
};

type CommandStoreInterface = { $pushCommand(command: CommandPatches): void };
