import { defineStore } from 'pinia';
import { defineState } from './pinia_helper';

const CountState = defineState({
  id: 'count/state',
  state: () => ({
    counter: 0,
  }),
});

export const useCount = defineStore('count', () => {
  const { defGet, defMut, defAct } = CountState.useControllerContext();

  const getCount = defGet(({ state }) => {
    return state.counter;
  });
  const mutIncrement = defMut(({ state }) => {
    state.counter += 1;
  });
  const actIncrement = defAct(({ commit }) => {
    commit(mutIncrement);
  });

  return {
    getCount,
    actIncrement,
  };
});
