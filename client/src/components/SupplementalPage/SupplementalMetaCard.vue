<template>
  <div class="panel-block">
    <p>
      <strong>
        <slot name="title"></slot>
      </strong>
      <slot name="description"></slot>
    </p>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
strong {
  display: block;
  font-size: 0.875rem;
  padding-block: 4px;
  color: hsl(207, 12%, 43%);
}
</style>
