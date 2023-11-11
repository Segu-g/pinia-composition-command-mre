import { defineStore, storeToRefs } from 'pinia';

import { defineCommandableState } from './command';

export const TextState = defineCommandableState({
  id: 'text/state',
  state: () => ({
    text: '',
  }),
});

export const useText = defineStore('text', () => {
  const { state, defGet, defMut, asCmd, getRef } = TextState.useContext();
  const changeTextMut = defMut((state, text: string) => {
    state.text = text;
  });
  const textGet = defGet((state) => state.text);
  return {
    state: storeToRefs(state),
    commandChangeText: asCmd(changeTextMut),
    text: getRef(textGet),
  };
});
