import { defineStore } from 'pinia';

export const CountState = defineStore({
  id: 'count/state',
  state: () => ({
    counter: 0,
  }),
});

export const useCount = defineStore('count', () => {
  return {};
});
