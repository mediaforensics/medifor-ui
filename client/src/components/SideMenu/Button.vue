<template>
  <button
    :disabled="disable"
    @click="clicked"
    class="button is-link is-light"
    v-bind:class="{
      'is-fullwidth': fullWidth,
      'is-link': isLink,
      'is-warning': isWarning,
      'is-outlined': isOutlined,
      'is-small': isSmall
    }"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: "MediforButton",
  props: {
    fullWidth: { default: false },
    isLink: { default: false },
    isWarning: { default: false },
    isOutlined: { default: false },
    isSmall: { default: false },
    disable: { default: false }
  },
  methods: {
    clicked() {
      this.$emit("clicked");
    }
  }
};
</script>
