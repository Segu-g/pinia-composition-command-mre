import { defineStore } from 'pinia';
import { ref } from 'vue';

import { defineCommand, useCommand } from './command';
import { toReadonlyStoreDefinition } from './storeHelper';

export const _useText = defineStore('text', () => {
  const text = ref('');
  return {
    text,
  };
});

export const useText = toReadonlyStoreDefinition(_useText);

export const useTextCommand = defineStore('textCommand', () => {
  const textStore = _useText();
  const commandStore = useCommand();
  const changeText = defineCommand(
    commandStore,
    { textStore },
    ({ textStore }, text: string) => {
      textStore.text = text;
    },
  );
  return { changeText };
});
