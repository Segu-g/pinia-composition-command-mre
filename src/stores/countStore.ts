import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useCommandContext } from './command';
import { toReadonlyStoreDefinition } from './storeHelper';

export const useCountState = defineStore('count/state', () => {
  const counter = ref(0);
  return {
    counter,
  };
});

const _useCount = defineStore('count', () => {
  const { defineCommand } = useCommandContext();
  const state = useCountState();
  const commandIncrement = defineCommand({ state }, ({ state }) => {
    state.counter += 1;
  });
  return { ...storeToRefs(state), commandIncrement };
});

export const useCount = toReadonlyStoreDefinition(_useCount);
