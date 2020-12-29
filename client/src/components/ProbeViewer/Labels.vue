<template>
  <div class="collapsible tag-group" :class="{ active: labelsOpen }">
    <div class="header">
      <h1>Labels</h1>
    </div>
    <div class="content active is-fullwidth">
      <div class="field has-addons">
        <div class="control">
          <input
            class="input"
            type="text"
            placeholder="Add Label(s)"
            v-model="newLabels"
            @keyup.enter="addTags"
            @input="restrict"
          />
        </div>
        <div class="control">
          <a class="button is-info" @click="addTags">
            +
          </a>
        </div>
      </div>
      <div class="tags">
        <span class="tag is-light is-medium" v-for="t in labels" :key="t">
          {{ t }}
          <button class="delete" @click="deleteTag(t)"></button>
        </span>
      </div>
    </div>
    <!--
      
      -->
  </div>
</template>

<script>
import * as probeService from "../services/ProbeService.js";
export default {
  name: "Labels",
  data: function() {
    return {
      base_uri: this.$store.getters.baseUri,
      newLabels: [],
      labelsOpen: true
    };
  },
  methods: {
    restrict(inputEvent) {
      //getting a InputEvent
      //Regex to test charater against
      const globalRegex = RegExp("[^a-z0-9, ]", "gi");

      //if its hit need to remove character
      if (globalRegex.test(inputEvent.data)) {
        this.newLabels = inputEvent.target.value.slice(0, -1);
        inputEvent.preventDefault();
        inputEvent.stopPropagation();
        return false;
      }
    },
    subGroupLabelIcon(group) {
      if (this.metaSubgroups.indexOf(group) == -1) return "caret-down";
      return "caret-up";
    },

    addTags() {
      // comma separated list without whitespace
      var tagList = this.newLabels.replace(/ /g, "").toLowerCase();

      if (tagList.length == 0) return;
      //tagList = tagList.replace(/,+/g, ",");
      //tagList = tagList.replace(/,\s*$/, "");

      if (this.$store.getters.probe.user_tags !== undefined) {
        var tagObjs = Object.getOwnPropertyNames(
          this.$store.getters.probe.user_tags
        );
        tagObjs.pop();
        tagObjs.forEach(t => {
          tagList += "," + t; //TODO:is this right?
        });
      }
      // add tags
      this.updateTags(this.$store.getters.probe.id, tagList); //TODO:can get a tag of empty which isnt good.

      //clear
      this.newLabels = "";
    },
    deleteTag(tag) {
      this.removeTag(this.$store.getters.probe.id, tag);
    },
    updateProbe: function() {
      var payload = {};
      payload.probe = this.$store.getters.probe;
      payload.include_fused =
        this.$store.getters.probe.analytic_info[0].detection.img_manip !== null;
      // update store changes
      this.$store.dispatch("getLabels");
      this.$store.dispatch("selectProbe", payload);
    },
    updateTags(id, tags) {
      probeService
        .updateTags(id, tags)
        .then(() => {
          this.updateProbe();
        })
        .catch(err => {
          console.error("UpdateLabels Error", err);
        });
    },
    removeTag(id, tag) {
      probeService
        .deleteTag(id, tag)
        .then(() => {
          this.updateProbe();
        })
        .catch(err => {
          console.error("UpdateLabels Error", err);
        });
    }
  },
  computed: {
    labels() {
      if (this.$store.getters.probe.user_tags == undefined) return [];
      var arr =
        this.$store.getters.probe == null
          ? []
          : this.$store.getters.probe.user_tags;
      var tags = Object.getOwnPropertyNames(arr);
      tags.pop();
      if (tags.indexOf(" ") >= 0) tags.splice(tags.indexOf(" "), 1);
      tags = tags.map(s => s);
      return tags.sort();
    },

    plusMinusLabel: function() {
      if (!this.labelsOpen) return "plus-circle";
      return "minus-circle";
    }
  }
};
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/_all";
.vcontainer {
  height: 100% !important;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 4px;
}
.collapsible {
  flex-basis: 40px;
  flex-grow: 0;
  transition: 0.5s;
  overflow: hidden;
}
.collapsible.active {
  flex-basis: auto;
  max-height: 50%;
}
.collapsible.tag-group.active {
  flex-basis: auto;
}
.columns {
  overflow-x: hidden;
  overflow-y: auto;
  visibility: visible;
  transition: 0.4s;
}
.columns.hidden {
  max-height: 0;
  visibility: hidden;
}
.column {
  padding: 4px;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.header {
  height: 40px;
  background: $info;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  font-size: 1.05em;
  transition: 0.3s;
  border-bottom: 1px solid #ccc;
  border-top: 1px solid #ccc;
}
.header:hover {
  background: $link;
}
.header h1 {
  font-weight: 800;
}
.header .columns {
  width: 100%;
}
.header .columns .column {
  margin-top: 14px;
}
.content .header {
  height: 35px;
  background: $light;
  color: $grey;
  font-weight: 600 !important;
}
.content .header:hover {
  background: #f0f0f0;
  color: $grey-dark;
}
.float-icon {
  position: relative;
  right: 6px;

  font-size: 16px;
}
.collapsible .content {
  max-height: 0;
  padding: 8px;
  overflow: hidden;
}
.content h4 {
  margin: 0;
}
.collapsible .content.active {
  max-height: 100%;
  overflow: auto;
}
.content.meta.active {
  display: block;
  background: white;
  padding: 3px;
  padding-bottom: 40px;
  overflow-x: hidden;
  overflow-y: scroll;
  max-height: 100%;
}
.analytics {
  padding: 3px;
  flex: 1;
  overflow: auto;
}

.field {
  width: 100%;
}
.control:first-of-type {
  flex: 1 1 auto;
  max-width: 100%;
}
</style>
