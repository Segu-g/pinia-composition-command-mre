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
  const { state, defGet, defMut, defAct, asCmd } = TextState.useContext();

  // mutation
  const changeTextMut = defMut((state, text: string) => {
    state.text = text;
  });
  const changeNameMut = defMut((state, text: string) => {
    state.name = text;
  });
  // action
  const changeTextAndName = defAct((text: string) => {
    changeNameMut.commit(text);
    changeNameMut.commit(text);
  });
  // command
  const commandChangeText = asCmd(changeTextMut);
  // getter
  const textGet = defGet((state) => state.text);
  const isTextSameToName = defGet((state) => state.name == textGet(state));

  return {
    state: storeToRefs(state),
    changeTextMut,
    changeNameMut,
    changeTextAndName,
    commandChangeText,
    textGet,
    isTextSameToName,
  };
});
