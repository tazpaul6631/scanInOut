<script setup lang="ts">
import DataTable from 'primevue/datatable'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <DataTable striped-rows row-hover v-bind="$attrs">
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </DataTable>
</template>
