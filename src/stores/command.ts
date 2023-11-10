import { defineStore, StoreGeneric } from 'pinia';
import { ref, computed } from 'vue';
import {
  enablePatches,
  enableMapSet,
  setAutoFreeze,
  createDraft,
  finishDraft,
  Patch,
} from 'immer';
import { applyPatch, Operation } from 'rfc6902';

import { useCountState } from './countStore';
import { useTextState } from './textStore';

enablePatches();
enableMapSet();
setAutoFreeze(false);

const useStoreArr = [useCountState, useTextState];

export const useCommand = defineStore('command', () => {
  const allStores = useStoreArr.map((useStore) => useStore());
  const storeIdMap = Object.fromEntries(
    allStores.map((store) => [store.$id, store]),
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

type StoreState<Store extends StoreGeneric> = Parameters<
  Parameters<Store['$patch']>[0]
>[0];
type MutationArgStates<Stores extends Record<string, StoreGeneric>> = {
  [K in keyof Stores]: StoreState<Stores[K]>;
};

function updateStore(store: StoreGeneric, patches: Patch[]) {
  const operations = patches.map(({ path, ...rest }) => ({
    ...rest,
    path: '/' + path.join('/'),
  })) as Operation[];
  store.$patch((state) => {
    applyPatch(state, operations);
  });
}

export const _defineCommand = <
  Stores extends Record<string, ReturnType<(typeof useStoreArr)[number]>>,
  Payloads extends unknown[],
>(
  commandStore: { $pushCommand(command: CommandPatches): void },
  stores: Stores,
  mutation: (state: MutationArgStates<Stores>, ...payloads: Payloads) => void,
) => {
  return (...payloads: Payloads) => {
    // Record operations
    const stateDrafts = Object.fromEntries(
      Object.entries(stores).map(([key, store]) => [
        key,
        createDraft(store.$state),
      ]),
    ) as MutationArgStates<Stores>;
    mutation(stateDrafts, ...payloads);
    const commandPatches: CommandPatches = Object.fromEntries(
      Object.entries(stores).map(([, store]) => [
        store.$id,
        { doPatches: [], undoPatches: [] },
      ]),
    );
    for (const key in stores) {
      finishDraft(stateDrafts[key], (patch, inversePatch) => {
        const target = commandPatches[stores[key].$id];
        target.doPatches = [...target.doPatches, ...patch];
        target.undoPatches = [...inversePatch, ...target.undoPatches];
      });
    }
    // apply patches
    for (const key in stores) {
      const { doPatches } = commandPatches[stores[key].$id];
      updateStore(stores[key], doPatches);
    }
    commandStore.$pushCommand(commandPatches);
  };
};

export const useCommandContext = () => {
  const command = useCommand();
  return {
    commnadStore: command,
    defineCommand: <
      Stores extends Record<string, ReturnType<(typeof useStoreArr)[number]>>,
      Payloads extends unknown[],
    >(
      stores: Stores,
      mutation: (
        state: MutationArgStates<Stores>,
        ...payloads: Payloads
      ) => void,
    ) => _defineCommand<Stores, Payloads>(command, stores, mutation),
  };
};
