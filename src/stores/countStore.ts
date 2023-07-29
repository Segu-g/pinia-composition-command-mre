import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useCommandContext } from './command';
import { toReadonlyStoreDefinition } from './storeHelper';
import { useStore } from '@/vuex-store';

export const useCountState = defineStore('count/state', () => {
  const counter = ref(0);
  return {
    counter,
  };
});

const _useCount = defineStore('count', () => {
  const vuexStore = useStore();

  const { defineCommand } = useCommandContext();
  const state = useCountState();
  const commandIncrement = defineCommand({ state }, ({ state }) => {
    state.counter += 1;
  });
  const countUpWithVuex = () => {
    state.counter += 1;
    vuexStore.commit('increment');
  };
  return { ...storeToRefs(state), commandIncrement, countUpWithVuex };
});

export const useCount = toReadonlyStoreDefinition(_useCount);
