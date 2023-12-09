<script setup lang="ts">
import { computed } from 'vue';
import { useController } from '@/stores/pinia_helper';
import { useCount } from '@/stores';
const countStore = useCount();
const { dispatch, get } = useController();
const countValue = computed(() => get(countStore.getCount));
const countUp = () => {
  dispatch(countStore.actIncrement);
};
</script>

<template>
  <div class="card">
    <button type="button" @click="countUp">count is {{ countValue }}</button>
  </div>
</template>
