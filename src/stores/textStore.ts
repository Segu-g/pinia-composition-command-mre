import { defineStore } from 'pinia';
import { ref } from 'vue';

import { defineCommand, useCommand } from './command';

export const useText = defineStore('text', () => {
  const text = ref('');
  return {
    text,
  };
});

export const useTextCommand = defineStore('textCommand', () => {
  const textStore = useText();
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
