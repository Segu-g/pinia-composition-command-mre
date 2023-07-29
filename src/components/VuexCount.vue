<script setup lang="ts">
import { useCount } from '@/stores';
import { useStore } from '@/vuex-store';
const store = useStore();
const piniaCount = useCount();
</script>

<template>
  <div class="card">
    <button type="button" @click="store.commit('increment')">vuex count is {{ store.state.count }}</button>
    <button type="button" @click="piniaCount.countUpWithVuex()">count up with pinia</button>
</div>
  
</template>
