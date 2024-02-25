import { defineStore } from 'pinia';
import { defineState, useSingleStateContext } from './pinia-helper';

export const TextState = defineState({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  const { defMut, defAct } = useSingleStateContext(TextState);
  const changeTextMut = defMut(({ state }, text: string) => {
    state.text = text;
  });
  const changeTextAct = defAct(({ commit }, text: string) => {
    commit(changeTextMut, text);
  });
  return { changeTextAct };
});
