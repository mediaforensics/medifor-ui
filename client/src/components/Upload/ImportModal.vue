<template>
  <div class="modal" :class="{ active: importModalView }">
    <div class="field has-addons ">
      <div class="control">
        <input
          class="input"
          type="text"
          placeholder="Upload from URL"
          v-model="uploadURL"
        />
      </div>
      <div class="control">
        <button class="button is-info" @click="urlUpload">
          Upload
        </button>
      </div>
    </div>
    <!-- labels applied -->
    <div class="field  ">
      <div class="control">
        <input
          class="input"
          type="text"
          placeholder="Comma-Separated tags"
          v-model="user_tags"
        />
      </div>
    </div>
    <div v-if="user_tags.length > 0">
      <p class="tags-list">
        <span v-for="tag in splitTags" :key="tag" class="tag is-medium">
          {{ tag }}
        </span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";
import * as probeService from "@/components/services/ProbeService";

export default {
  name: "ImportModal",
  data() {
    return {
      uploadURL: "",
      user_tags: ""
    };
  },
  methods: {
    ...mapActions(["getProbes", "uploadFromUrl"]),
    ...mapMutations(["selectMenu", "setLoading"]),
    urlUpload() {
      if (this.uploadURL == "") return;
      let a = document.createElement("a");
      a.href = this.uploadURL;
      if (!(a.host && a.host != window.location.host)) {
        this.uploadURL = "";
        alert("Not a valid image url");
        return;
      }
      this.selectMenu("");
      this.setLoading("true");
      probeService
        .uploadFromURL(this.uploadURL, this.splitTags)
        .then(() => {
          this.getProbes();
          this.user_tags = "";
          this.uploadURL = "";
        })
        .catch(err => {
          alert(err.response.data);
          this.getProbes();
          this.user_tags = "";
          this.uploadURL = "";
        });
    }
  },
  computed: {
    ...mapState({
      importModalView: state => state.layout.importModalView
    }),
    splitTags: function() {
      if (this.user_tags === "") return;
      var tags = this.user_tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t !== "");
      return tags;
    }
  }
};
</script>

<style lang="scss" scoped>
.modal {
  display: inline-block;
  background: white;
  position: fixed;
  padding: 12px;
  width: 300px;
  height: 150px;
  top: 7em;
  left: -100%;
  z-index: 9999;
  border-radius: 10px;
  filter: drop-shadow(2px 6px 2px #888888);
  overflow: visible;
  transition: 0.3s all ease-in-out;
  opacity: 0;
}
.modal::after {
  display: block;
  position: absolute;
  left: -60px;
  top: calc(50% - 30px);
  border: 30px solid transparent;
  content: "";
  position: absolute;
  pointer-events: none;
  border-right-color: white;
}

.modal.active {
  left: 6em;
  opacity: 1;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  background: white;
  border-radius: 10px;
  margin: -12px;
  padding: 12px;
}
.tags-list .tag {
  margin: 3px;
  filter: drop-shadow(1px 3px 1px #888888);
}
</style>
