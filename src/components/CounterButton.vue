<script setup lang="ts">
import { computed } from 'vue';
import { useStateStore } from '@/stores/pinia-helper';
import { useCount } from '@/stores';
const countStore = useCount();
const { dispatch, get } = useStateStore();
const countValue = computed(() => get(countStore.getCount));
const countUp = () => {
  console.log(countStore.actIncrement);
  dispatch(countStore.actIncrement);
};
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ countValue }}</button>
  </div>
</template>
