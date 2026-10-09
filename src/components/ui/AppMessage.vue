<script setup lang="ts">
import Message from 'primevue/message'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Message v-bind="$attrs">
    <slot />
  </Message>
</template>
