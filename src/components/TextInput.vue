<script setup lang="ts">
import { TextState, useText } from "@/stores/textStore"
import { useStateStore } from '@/stores/pinia-helper';
import { computed } from "vue";

const textStore = useText();
const { dispatch, fetch } = useStateStore();
const text = computed(() => fetch(TextState).text)
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement && dispatch(textStore.changeTextAct, evt.target.value);
};
</script>

<template>
  <div class="card">
    <p>{{ text }}</p>
    <input :value="text" @input="onChange" />
  </div>
</template>
