<script setup lang="ts">
import Column from 'primevue/column'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Column v-bind="$attrs">
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </Column>
</template>
