import { defineStore, storeToRefs } from 'pinia';

import { defineCommandableState } from './pinia_helper';

export const TextState = defineCommandableState({
  id: 'text/state',
  state: () => ({
    text: '',
  }),
});

export const useText = defineStore('text', () => {
  const { state, defMut, asCmd } = TextState.useContext();
  const commandChangeText = defMut((state, text: string) => {
    state.text = text;
  });
  return { ...storeToRefs(state), commandChangeText: asCmd(commandChangeText) };
});
