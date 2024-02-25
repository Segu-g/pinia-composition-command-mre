<script setup lang="ts">
import { TextState, useText } from "@/stores/textStore"
import { useStateStore } from '@/stores/pinia-helper/command-execution';
import { useHistory } from "@/stores/command";
import { computed } from "vue";

const textStore = useText();
const history = useHistory();
const { fetch, command } = useStateStore(history);
const text = computed(() => fetch(TextState).text)
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement && command(textStore.changeTextCmd, evt.target.value);
};
</script>

<template>
  <div class="card">
    <p>{{ text }}</p>
    <input :value="text" @input="onChange" />
  </div>
</template>
