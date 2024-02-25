import { ref, computed } from 'vue';
import { StateTree, defineStore, DefineStoreOptions, Store } from 'pinia';

import { Patch } from 'immer';
import { applyPatchesImpl } from './immer';

import { StateStore, USE_STATE } from './interface';
import { defineState } from './definition';
import {
  COMMANDABLE_STATE,
  CommandPatches,
  CommandableState,
} from './command-interface';

const useStateObj: Record<string, StateStore<string, StateTree>> = {};
/**
 * `Command`に対応したStateを持つ`store`は`commandStore`からアクセスするため`useStateObj`に`useStore`を登録する.
 * `defineCommandableState`を経由してstateを定義することで`useStateObj`に登録される．
 */
export const defineCommandableStateStore = <
  Id extends string,
  S extends StateTree,
>(
  option: DefineStoreOptions<Id, S, Record<never, never>, Record<never, never>>,
): CommandableState<Id, S> => {
  const stateStore = defineState(option);
  useStateObj[option.id] = stateStore;
  return {
    [COMMANDABLE_STATE]: stateStore[USE_STATE],
    ...stateStore,
  };
};

const getStoreIdMap = () =>
  Object.fromEntries(
    Object.entries(useStateObj).map(
      ([id, useStore]) => [id, useStore[USE_STATE]()] as const,
    ),
  );

export const defineHistory = <Id extends string>(id: Id) => {
  return defineStore(id, () => {
    const stackedPatchesHistory = ref<CommandPatches[]>([]);
    const poppedPatchesHistory = ref<CommandPatches[]>([]);

    const undoable = computed(() => stackedPatchesHistory.value.length !== 0);
    const redoable = computed(() => poppedPatchesHistory.value.length !== 0);

    const undo = () => {
      const command = stackedPatchesHistory.value.pop();
      if (command === undefined) return;
      for (const [storeId, { undoPatches }] of Object.entries(command)) {
        updateStore(getStoreIdMap()[storeId], undoPatches);
      }
      poppedPatchesHistory.value.push(command);
    };

    const redo = () => {
      const command = poppedPatchesHistory.value.pop();
      if (command === undefined) return;
      for (const [storeId, { doPatches }] of Object.entries(command)) {
        updateStore(getStoreIdMap()[storeId], doPatches);
      }
      stackedPatchesHistory.value.push(command);
    };

    const $pushCommand = (command: CommandPatches) => {
      for (const [storeId, { doPatches }] of Object.entries(command)) {
        updateStore(getStoreIdMap()[storeId], doPatches);
      }
      poppedPatchesHistory.value = [];
      stackedPatchesHistory.value.push(command);
    };

    return {
      stackedPatchesHistory,
      poppedPatchesHistory,
      undoable,
      redoable,
      undo,
      redo,
      $pushCommand,
    };
  });
};

function updateStore(store: Store<string, StateTree>, patches: Patch[]) {
  store.$patch((state: unknown) => {
    applyPatchesImpl(state, patches);
  });
}
