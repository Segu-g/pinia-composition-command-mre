<script setup lang="ts">
import { useStore } from '@/vuex-store';
const store = useStore();
</script>

<template>
  <div class="card">
    <button type="button" @click="store.commit('increment')">
      vuex count is {{ store.state.count }}
    </button>
    <button type="button" @click="console.log">count up with pinia</button>
  </div>
</template>
