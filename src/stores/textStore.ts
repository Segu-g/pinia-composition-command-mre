import { defineStore, storeToRefs } from 'pinia';

import { defineCommandableState } from './command';

export const TextState = defineCommandableState({
  id: 'text/state',
  state: () => ({
    text: '',
    name: '',
  }),
});

export const useText = defineStore('text', () => {
  const { state, defGet, defMut, asCmd } = TextState.useContext();
  const changeTextMut = defMut((state, text: string) => {
    state.text = text;
  });
  const changeNameMut = defMut((state, text: string) => {
    state.name = text;
  });
  const commandChangeText = asCmd(changeTextMut);
  const textGet = defGet((state) => state.text);
  const isTextSameToName = defGet((state) => state.name == textGet(state));
  return {
    state: storeToRefs(state),
    changeTextMut,
    changeNameMut,
    commandChangeText,
    textGet,
    isTextSameToName,
  };
});
