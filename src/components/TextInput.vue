<script setup lang="ts">
const onChange = (evt: Event) => {
  evt.target instanceof HTMLInputElement && true;
};
</script>

<template>
  <div class="card">
    <p>{{ 'a' }}</p>
    <input :value="'a'" @input="onChange" />
  </div>
</template>
