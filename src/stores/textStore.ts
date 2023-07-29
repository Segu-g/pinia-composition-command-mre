import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useCommandContext } from './command';
import { toReadonlyStoreDefinition } from './storeHelper';

export const useTextState = defineStore('text/state', () => {
  const text = ref('');
  return {
    text,
  };
});

const _useText = defineStore('text', () => {
  const state = useTextState();
  const { defineCommand } = useCommandContext();
  const commandChangeText = defineCommand(
    { state },
    ({ state }, text: string) => {
      state.text = text;
    },
  );
  return { ...storeToRefs(state), commandChangeText };
});

export const useText = toReadonlyStoreDefinition(_useText);
