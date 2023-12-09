import { defineStore } from 'pinia';

export const TextState = defineStore({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  return {};
});
