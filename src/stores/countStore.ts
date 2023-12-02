import { defineStore, storeToRefs } from 'pinia';
import { defineCommandableState } from './command';
import { useStore } from '@/vuex-store';

export const CountState = defineCommandableState({
  id: 'count/state',
  state: () => ({
    counter: 0,
  }),
});

export const useCount = defineStore('count', () => {
  const vuexStore = useStore();
  const { state, defGet, defMut, defAct, asCmd } = CountState.useContext();
  const increment = defMut((state) => {
    state.counter += 1;
  });
  const getCount = defGet((state) => {
    // increment(state); // error
    return state.counter;
  });
  const commandIncrement = asCmd(increment.func);
  const countUpWithVuex = defAct(() => {
    // increment(state) // error
    commandIncrement.dispatch();
    vuexStore.commit('increment');
  });
  return {
    state: storeToRefs(state),
    getCount,
    commandIncrement,
    countUpWithVuex,
  };
});
