import { defineStore } from 'pinia';
import { ref } from 'vue';

import { useCommandContext } from './command';
import { toReadonlyStoreDefinition } from './storeHelper';

export const _useCounter = defineStore('counter', () => {
  const counter = ref(0);
  const increment = () => (counter.value += 1);
  return {
    counter,
    increment,
  };
});

export const useCounter = toReadonlyStoreDefinition(_useCounter);

export const useCounterCommand = defineStore('counterCommand', () => {
  const { defineCommand } = useCommandContext();
  const counter = _useCounter();
  const increment = defineCommand({ counter }, ({ counter }) => {
    counter.counter += 1;
  });
  return { increment };
});
