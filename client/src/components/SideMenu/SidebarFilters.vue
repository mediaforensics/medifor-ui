<template>
  <Container title="Filters">
    <div class="actions">
      <Button
        slot="actions"
        :disable="!isDirty"
        :isWarning="true"
        :isSmall="true"
        :isOutlined="true"
        @clicked="reset"
        >Reset</Button
      >
    </div>

    <form @change="onFormChange">
      <!-- score thresholding -->
      <div v-if="userIsDefined" style="padding: 4px">
        <span class="usermedia">
          <Prompt
            text="My Uploaded Media"
            style="display: inline; padding-right: 4em; "
          />
          <toggle-button
            v-model="userMedia"
            @change="onFormChange"
            :sync="true"
            :height="17"
            :width="50"
            style="margin-top: 15px"
            :color="{ checked: '#0276fd', unchecked: '#b0c4de' }"
          />
        </span>
      </div>
      <div v-if="initialFusionModel" class="fusionControls">
        <Prompt text="Fusion Model" />
        <FusionModel
          :fusion-model-id="fusionModel.id"
          @fuser-updated="updateFusionModel"
        />

        <Prompt text="Integrity Threshold" />
        <ul style="display: flex ;place-content: flex-start center; ">
          <li
            v-for="(fusionThresholdType, key) in fusionThresholdTypes"
            :key="key"
            style="flex: 1 1 40%;"
          >
            <label style="display: flex;">
              <input
                type="radio"
                name="fusionThreshold"
                v-model="fusionThreshold.type"
                :value="key"
              />
              <span style="padding-left: 6px;">{{
                fusionThresholdType.text
              }}</span>
            </label>
          </li>
        </ul>

        <div
          class="control"
          style="display: flex; align-items: flex-end;"
          :style="{
            opacity: fusionThreshold.type === 'NONE' ? '0.5' : '1'
          }"
        >
          <input
            style="width: 100%;"
            type="range"
            v-model="fusionThreshold.value"
            :disabled="fusionThreshold.type === 'NONE'"
          />
          <span style="flex: 0 0 2em; text-align: right;"
            >{{ Math.floor(fusionThreshold.value) }}
          </span>
        </div>
      </div>

      <Prompt text="Media Type" />
      <ul>
        <li>
          <label>
            <input
              type="radio"
              v-model="selectedTags.system"
              :disabled="fusionModel.handles.length === 1"
            />
            <span>
              All
            </span>
            <span class="count">
              {{ systemTotal }}
            </span>
          </label>
        </li>
        <li v-for="tag in systemTags" :key="tag[0]">
          <label>
            <!-- Radio buttons should only ever be disabled if showing a fuser that works on single type of probe
            ---- When a user has Boosted Manipulation Detection selected all buttons should be available ------->

            <input
              v-if="initialFusionModel"
              type="radio"
              :value="tag[0]"
              v-model="selectedTags.system"
              :disabled="!fusionModel.handles.includes(tag[0])"
            />

            <!-- If there are no fusers in the system then no tags will be 'auto-disabled' -->
            <input
              v-else
              type="radio"
              :value="tag[0]"
              v-model="selectedTags.system"
            />
            <span>
              {{ capitalize(tag[0]) }}
            </span>
            <span class="count">
              {{ tag[1] }}
            </span>
          </label>
        </li>
      </ul>

      <Prompt text="Tags" />
      <ul>
        <li v-for="tag in userTags" :key="tag[0]">
          <label>
            <input
              type="checkbox"
              :value="tag[0]"
              v-model="selectedTags.user"
            />
            <span>
              {{ tag[0] }}
            </span>
            <span class="count">
              {{ tag[1] }}
            </span>
          </label>
        </li>
      </ul>
    </form>
  </Container>
</template>

<script>
import { mapState, mapMutations, mapGetters } from "vuex";
import { setPreference } from "@/helpers/userPreferences";
import { FusionThresholdType } from "../constants/fusion";
import { ToggleButton } from "vue-js-toggle-button";

import Button from "./Button";
import Prompt from "./Prompt";
import Container from "./Container";
import FusionModel from "./FusionModel";

export default {
  name: "SidebarFilters",
  components: { Button, Container, FusionModel, Prompt, ToggleButton },
  props: ["initialFusionModel"],
  data: function() {
    return {
      fusionThresholdTypes: FusionThresholdType,

      selectedTags: {
        system: null,
        user: []
      },
      fusionModel: {
        id: "",
        handles: []
      },
      fusionThreshold: {
        type: "NONE",
        value: 50
      },
      userMedia: false,
      isDirty: false
    };
  },

  computed: {
    ...mapState({
      ...mapGetters([
        "sortDir",
        "sortField",
        "userTagPrefix",
        "tagPrefixFlag",
        "groupTagPrefix",
        "queryParameters"
      ]),
      systemTags(state) {
        let counts = state.pipeline.labels.tag_counts;
        return Object.keys(counts)
          .map(value => [this.dechrisifyValue(value), counts[value]])
          .sort((a, b) => {
            if (a[0] >= b[0]) return 1;
            else return -1;
          });
      },
      systemTotal: state => {
        const counts = Object.values(state.pipeline.labels.tag_counts);

        return counts.length > 0
          ? counts.reduce((previous, current) => {
              return previous + current;
            })
          : 0;
      },
      userTags(state) {
        const user_tag_counts = state.pipeline.labels.user_tag_counts;
        const countedTags = [];
        for (let [key, value] of Object.entries(user_tag_counts)) {
          countedTags.push([this.dechrisifyKey(key), value]);
        }
        countedTags.sort((a, b) => {
          if (a[0] < b[0]) return -1;
          if (a[0] > b[0]) return 1;
          return 0;
        });
        return countedTags;
      },
      username: state => state.user.name,
      scoreDir: state => state.layout.scoreDir,
      tagCounts: state => state.pipeline.labels,
      selectedGroup: state => state.user.selectedGroup,
      fusers: state => state.pipeline.analyticList.fusers,
      defaultFilterLabels: state => state.pipeline.defaultFilterLabels
    }),
    userIsDefined() {
      return this.username && this.userTagPrefix && this.tagPrefixFlag;
    }
  },

  methods: {
    ...mapMutations([
      "applyFilters",
      "resetPageToken",
      "setFusionModel",
      "setScoreDir",
      "setScoreThreshold",
      "setFilters",
      "setUserSelectedMedia"
    ]),

    capitalize: text => text.slice(0, 1).toUpperCase() + text.slice(1),
    dechrisifyKey: text => text.split("=")[0],
    dechrisifyValue: text => text.split("=")[1],
    rechrisifyKey: text => text + "=null",
    rechrisifyValue: text => "type=" + text.toLowerCase(),

    onFormChange() {
      this.isDirty = true;
      this.refresh();
    },

    setSlider() {
      const {
        fusion_threshold_type: type,
        fusion_threshold_value: value
      } = this.$route.query;
      this.fusionThreshold.type =
        type == 0 ? "NONE" : type == 1 ? "LESS_THAN" : "GREATER_THAN";
      this.fusionThreshold.value = value * 100;
    },

    updateFusionModel: function(fusionModel) {
      this.fusionModel = { ...fusionModel };
      setPreference("fusionModel", fusionModel.id);
      /* Need to explicity set new system tags when fusion model chanages from drop down */
      this.selectedTags.system =
        fusionModel.handles.length == 1 ? fusionModel.handles[0] : null;
    },

    /* System tags are what drive the radio buttons and are determined by what the fuser handles
     * If the fuser handles more than one media type the system tag will be set to null and will show 'All' in the ui */
    setSystemTags: function() {
      let allTags = [];
      if (this.$route.query.tags) {
        const { tags } = this.$route.query;
        allTags = tags.includes(",") ? tags.split(",") : tags.split();
      }

      /* Pull out all system tags */
      let filteredSystemTags = allTags.filter(tag => tag.includes("type="));

      this.selectedTags.system =
        filteredSystemTags.length == 1
          ? this.dechrisifyValue(filteredSystemTags[0])
          : null;
    },

    /* Set the checked user tags from the URL on load */
    setUserTags: function() {
      let filteredUserTags = [];
      if (this.$route.query.tags) {
        const { tags } = this.$route.query;
        filteredUserTags = tags.includes(",") ? tags.split(",") : tags.split();
      }
      /* Pull out all user tags*/
      filteredUserTags = filteredUserTags.filter(tag => tag.includes("=null"));
      this.selectedTags.user = filteredUserTags.map(tag =>
        this.dechrisifyKey(tag)
      );
    },
    /* Determines what media types the current fusionModel handles */
    setHandler: function() {
      this.fusionModel.handles =
        this.fusionModel.id !== ""
          ? this.fusers.find(f => f.id == this.fusionModel.id).handles
          : [];
    },

    /* Set all of the store values, probeService pulls from the store when dispatching for new gallery */
    setStore: function({ filters, userMedia, id, value, direction }) {
      this.setFusionModel(id);
      this.applyFilters(filters);
      this.setScoreDir(direction);
      this.setScoreThreshold(value);
      this.setUserSelectedMedia(userMedia);
    },

    /* Update the route with values just set in store, this will trigger dispatch to probeService */
    updateRoute: function() {
      const { path: currentPath } = this.$route;
      this.$router.push({ path: currentPath, query: this.queryParameters });
    },

    refresh: function() {
      const _this = this;
      const filters = [];
      const userTags = this.selectedTags.user.map(t => _this.rechrisifyKey(t));
      const systemTags = this.selectedTags.system
        ? [_this.rechrisifyValue(this.selectedTags.system)]
        : [];

      filters.push(...userTags, ...systemTags);

      this.setStore({
        filters: filters,
        id: this.fusionModel.id,
        userMedia: this.userMedia,
        value: this.fusionThreshold.value,
        direction: this.fusionThresholdTypes[this.fusionThreshold.type].value
      });

      this.updateRoute();
    },

    reset: function() {
      this.isDirty = false;
      this.userMedia = false;

      /* Reset user preferred fusion model to default*/
      setPreference("fusionModel", this.initialFusionModel);

      /* Reset the store to its default setting */
      this.setStore({
        value: 60,
        direction: 0,
        userMedia: this.userMedia,
        id: this.initialFusionModel,
        filters: this.defaultFilterLabels
      });
      /* Route update will trigger watcher and handle component state values */
      this.updateRoute();
    },
    handleMenuValues() {
      this.fusionModel.id = this.$route.query.fuser_id;
      this.setHandler();
      this.setUserTags();
      this.setSystemTags();
      this.setSlider();
      this.isDirty = true;
    }
  },

  created: function() {
    this.handleMenuValues();
  },

  watch: {
    "$route.query": {
      handler: function(current, previous) {
        if (
          JSON.stringify(previous) !== JSON.stringify(current) &&
          this.$route.name !== "upload"
        ) {
          this.handleMenuValues();
        }
      }
    }
  }
};
</script>

<style scoped>
label {
  display: flex;
  padding-bottom: 4px;
  font-size: 1rem;
  align-items: center;
}

label > span:first-of-type {
  padding-left: 8px;
  flex-grow: 1;
}

label > span:last-of-type {
  font-variant-numeric: tabular-nums;
}

.count {
  color: hsl(0, 0%, 70%);
}

.thresholdOptions {
  padding-left: 12px;
  display: flex;
  justify-content: space-between;
}

.thresholdOptions > label {
  flex: 1 1 auto;
}

ul {
  margin-bottom: 12px;
  padding-left: 12px;
}

h3 {
  font-size: 0.9em;
}

.searchBox {
  border-radius: 5px;
  padding: 5px;
  margin: 12px;
  width: 90%;
}

.actions {
  display: flex;
  flex-direction: row-reverse;
}

.usermedia {
  display: flex;
  align-items: center;
}
</style>
