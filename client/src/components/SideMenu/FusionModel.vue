<template>
  <div class="fusion-model">
    <select v-model="fusionModel.id" @change="selectEvent">
      <option v-for="fuser in fusers" :key="fuser.id" :value="fuser.id">
        {{ fuser.name }}
      </option>
    </select>

    <div class="dropdown is-hoverable is-right info-trigger">
      <div class="dropdown-trigger">
        <span class="has-text-white">
          <font-awesome-icon icon="info-circle" />
        </span>
      </div>
      <div class="dropdown-menu" id="dropdown-menu4" role="menu">
        <div class="dropdown-content">
          <div class="dropdown-item" v-for="fuser in fusers" :key="fuser.id">
            <div>
              <strong>{{ fuser.name }}</strong>
            </div>
            <div>{{ fuser.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "FusionModel",

  props: {
    fusionModelId: { type: String }
  },

  data() {
    return {
      fusionModel: {
        id: "",
        handles: []
      }
    };
  },
  methods: {
    selectEvent() {
      const handles =
        this.fusionModel.id !== ""
          ? this.fusers.find(f => f.id === this.fusionModel.id).handles
          : [];
      this.fusionModel.handles = handles;

      this.$emit("fuser-updated", this.fusionModel);
    }
  },
  computed: {
    ...mapState({
      fusers: state => {
        return state.pipeline.analyticList.fusers.sort((a, b) => {
          const aVal = a.name;
          const bVal = b.name;

          if (aVal >= bVal) return 1;
          if (bVal > aVal) return -1;
        });
      }
    })
  },

  watch: {
    fusionModelId() {
      this.fusionModel.id = this.fusionModelId;
    }
  },

  mounted() {
    this.fusionModel.id = this.fusionModelId;
  }
};
</script>

<style scoped>
.fusion-model {
  display: flex;
  justify-content: space-between;
}

.fusion-model > select {
  flex: 1 1 100%;
}

.info-trigger {
  flex-shrink: 1;
  margin-left: 0.5em;
}
</style>
