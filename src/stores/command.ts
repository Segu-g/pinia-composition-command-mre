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

const getUseStoreArr = () => [useCountState, useTextState];

export const useCommand = defineStore('command', () => {
  const allStores = getUseStoreArr().map((useStore) => useStore());
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
    for (const [storeId, { inversePatches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], inversePatches);
    }
    popedPatchesHistory.value.push(command);
  };

  const redo = () => {
    const command = popedPatchesHistory.value.pop();
    if (command === undefined) return;
    for (const [storeId, { patches }] of Object.entries(command)) {
      updateStore(storeIdMap[storeId], patches);
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
    patches: Patch[];
    inversePatches: Patch[];
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
  Stores extends Record<
    string,
    ReturnType<ReturnType<typeof getUseStoreArr>[number]>
  >,
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
        { patches: [], inversePatches: [] },
      ]),
    );
    for (const key in stores) {
      finishDraft(stateDrafts[key], (patch, inversePatch) => {
        const target = commandPatches[stores[key].$id];
        target.patches = [...target.patches, ...patch];
        target.inversePatches = [...inversePatch, ...target.inversePatches];
      });
    }
    // apply patches
    for (const key in stores) {
      const { patches } = commandPatches[stores[key].$id];
      updateStore(stores[key], patches);
    }
    commandStore.$pushCommand(commandPatches);
  };
};

export const useCommandContext = () => {
  const command = useCommand();
  return {
    commnadStore: command,
    defineCommand: <
      Stores extends Record<
        string,
        ReturnType<ReturnType<typeof getUseStoreArr>[number]>
      >,
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
