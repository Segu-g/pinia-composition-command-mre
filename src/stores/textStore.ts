import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useCommandContext } from './command';
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
  const { defineCommand } = useCommandContext();
  const changeText = defineCommand(
    { textStore },
    ({ textStore }, text: string) => {
      textStore.text = text;
    },
  );
  return { changeText };
});
