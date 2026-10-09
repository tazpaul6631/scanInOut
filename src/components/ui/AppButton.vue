<script setup lang="ts">
import Button from 'primevue/button'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Button :ripple="false" raised v-bind="$attrs">
    <slot />
  </Button>
</template>
