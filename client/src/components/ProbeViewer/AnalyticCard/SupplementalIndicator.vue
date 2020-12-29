<template functional>
  <div>
    <router-link
      :to="{
        name: 'supplemental',
        query: { probe: props.probeId, analytic: props.analyticId }
      }"
      target="_blank"
    >
      <font-awesome-icon icon="bars" />
      Supplemental Data
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
    probeId: String,
    analyticId: String
  }
};
</script>

<style scoped>
div {
  vertical-align: baseline;
  padding-top: 4px;
  padding-left: 4px;
}
</style>
