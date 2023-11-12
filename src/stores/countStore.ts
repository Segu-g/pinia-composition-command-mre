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
  const { state, defMut, asCmd } = CountState.useContext();
  const increment = defMut((state) => {
    state.counter += 1;
  });
  const commandIncrement = asCmd(increment);
  const countUpWithVuex = () => {
    commandIncrement();
    vuexStore.commit('increment');
  };
  return {
    state: storeToRefs(state),
    commandIncrement,
    countUpWithVuex,
  };
});
