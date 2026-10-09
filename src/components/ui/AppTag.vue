<script setup lang="ts">
import Tag from 'primevue/tag'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Tag v-bind="$attrs">
    <slot />
  </Tag>
</template>
