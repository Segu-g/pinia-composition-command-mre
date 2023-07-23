import { defineStore } from 'pinia';
import { ref } from 'vue';

import { defineCommand } from './command';

export const useText = defineStore('text', () => {
  const text = ref('');
  return {
    text,
  };
});

export const useTextCommand = defineStore('textCommand', () => {
  const textStore = useText();
  const changeText = defineCommand({ textStore }, ({ textStore }, text) => {
    textStore.text += text;
  });
  return { changeText };
});
