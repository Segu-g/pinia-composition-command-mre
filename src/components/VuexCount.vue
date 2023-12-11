<script setup lang="ts">
import { useStore } from '@/vuex-store';
import { useCount } from '@/stores';
import { useController } from '@/stores/command';
const { commandDispatch } = useController();
const store = useStore();
const countStore = useCount();
const countUpWithPinia = () => {
  store.commit('increment');
  commandDispatch(countStore.cmdIncrement);
};
</script>

<template>
  <div class="card">
    <button type="button" @click="store.commit('increment')">
      vuex count is {{ store.state.count }}
    </button>
    <button type="button" @click="countUpWithPinia">count up with pinia</button>
  </div>
</template>
