<template>
  <div id="upload-container" class="card">
    <div class="v-wrapper">
      <!-- -->
      <div class="upload-header">
        <div class="flexform">
          <div class="field has-addons ">
            <div class="control">
              <input
                class="input"
                type="text"
                placeholder="Comma Separated Labels"
                v-model="newLabels"
                @keyup.enter="addLabels"
              />
            </div>
            <div class="control">
              <button class="button is-info" @click="addLabels">
                Add Label(s)
              </button>
            </div>
          </div>

          <span
            class="tag is-light is-medium"
            v-for="label in tags"
            :key="label"
          >
            {{ label }}
            <button class="delete" @click="removeLabel(label)"></button>
          </span>
        </div>
      </div>
      <!-- -->
      <div
        class="upload-hint"
        @dragover="isHovering = true"
        @dragleave="isHovering = false"
        :class="{ hover: isHovering }"
      >
        <form action="" enctype="multipart/form-data">
          <input
            type="file"
            multiple
            name="probe"
            @change="addFiles($event.target.files)"
            :accept="acceptedFilesList(filesFormat.input)"
            class="input-file"
          />
          <i class="hint">
            Drag and drop
            <b>{{ acceptedFilesList(filesFormat.hint) }}</b> files or click here
          </i>
        </form>
      </div>
      <div></div>
      <!-- -->
      <div class="upload-content">
        <table
          class="table is-fullwidth"
          v-if="files !== null && filesArr.length > 0 && status === ''"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Type</th>
              <th class="shrink">Remove</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(file, i) in filesArr" :key="file + i">
              <td>{{ file.name }}</td>
              <td>{{ file.size }}&nbsp;bytes</td>
              <td>{{ file.type }}</td>
              <td class="shrink">
                <a
                  class="tag is-danger is-delete is-medium"
                  @click="removeFile(file)"
                ></a>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="status === 'uploading'">
          <ProgressBar
            :curr="$store.getters.uploadProgress"
            :max="$store.getters.uploadTotal"
          />
          <div class="centered-message">
            Uploading Files<br />
            <font-awesome-icon icon="spinner" class="fa-spin" />
          </div>
        </div>
      </div>
      <!-- -->
      <div class="upload-footer">
        <div class="buttons has-addons is-pulled-left">
          <button
            class="button is-danger"
            @click="closeUploadMenu"
            :disabled="status == 'uploading'"
          >
            Cancel
          </button>
        </div>
        <div class="buttons has-addons is-pulled-right">
          <button
            class="button is-success"
            :disabled="filesArr.length == 0 || status == 'uploading'"
            @click="uploadFiles()"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as probeService from "../services/ProbeService.js";
import ProgressBar from "./ProgressBar.vue";
import { mapState, mapGetters } from "vuex";

export default {
  name: "UploadContainer",
  props: {
    base_url: String
  },
  components: {
    ProgressBar
  },
  data: function() {
    return {
      labels: "",
      newLabels: "",
      files: null,
      filesArr: [],
      status: "",
      isHovering: false,
      filesFormat: {
        input: 1,
        hint: 0
      }
    };
  },
  methods: {
    addLabels() {
      // comma separate, trim, replace
      var tagList = this.newLabels.replace(/ /g, "").toLowerCase();
      if (tagList.length == 0) return;
      tagList = tagList.replace(/,+/g, ",");
      tagList = tagList.replace(/,\s*$/, "");
      if (this.labels.length > 0) tagList += "," + this.labels;

      this.labels = tagList;
      //console.log("tags: ", this.labels);

      //clear
      this.newLabels = "";
    },
    removeLabel(label) {
      var arr = this.tags;
      arr.splice(arr.indexOf(label), 1);
      if (arr.length == 0) {
        this.labels = "";
        return;
      }
      var newTags = arr.shift();
      arr.forEach(a => {
        newTags += "," + a;
      });
      this.labels = newTags;
    },
    addFiles(incomingFiles) {
      if (!incomingFiles.length) return;
      const acceptableFiles = this.acceptableFiles;
      let formData = this.files == null ? new FormData() : this.files;

      for (let i = 0; i < incomingFiles.length; i++) {
        let file = incomingFiles[i];
        let mimetype = file.type.split("/")[0];
        /* Blocks user from 'dragging' unnaccepted file type into upload space */
        if (mimetype in acceptableFiles && acceptableFiles[mimetype])
          formData.append("probe", file, file.name);
      }
      //
      this.files = formData;
      // filesArr is necessary because vue can't handle the getAll function itself
      this.filesArr = this.files.getAll("probe");
      this.isHovering = false;
    },
    uploadFiles() {
      this.files.append("tags", this.labels);
      // start loading
      this.$store.commit("setUploadTotal", this.files.getAll("probe").length);
      this.status = "uploading";
      probeService
        .uploadProbe(this.files)
        .then(() => {
          this.status = "";
          this.closeUploadMenu();
        })
        .catch(err => {
          console.log("error occured uploading", err);
        });
    },
    removeFile(file) {
      var idx = this.filesArr.indexOf(file);
      var tmpFiles = this.files.getAll("probe");
      tmpFiles.splice(idx, 1);
      this.files.delete("probe");
      tmpFiles.forEach(element => {
        this.files.append("probe", element, element.name);
      });
      this.filesArr = this.files.getAll("probe");
    },
    fileToImage: function(file) {
      var reader = new FileReader();
      reader.onload = function() {
        return reader.result;
      };
      reader.readAsDataURL(file);
    },
    closeUploadMenu() {
      if (this.probe) {
        this.$router.push({
          name: "probe",
          params: { id: this.probe.id },
          query: this.queryParameters
        });
      } else
        this.$router.push({
          name: "gallery",
          query: this.queryParameters
        });
    },
    acceptedFilesList(formattingFlag) {
      let listOfAcceptableFiles = [];
      const acceptableFiles = this.acceptableFiles;

      /* Format for input needs to be image/*,video/*,audio/*
       * Format for hint needs to be image/video/audio */

      for (let [key, value] of Object.entries(acceptableFiles)) {
        if (value) {
          if (formattingFlag == this.filesFormat.input)
            listOfAcceptableFiles.push(`${key}/*`);
          else listOfAcceptableFiles.push(key);
        }
      }
      return formattingFlag == this.filesFormat.input
        ? listOfAcceptableFiles.join(",")
        : formattingFlag == this.filesFormat.hint
        ? listOfAcceptableFiles.join("/")
        : "";
    }
  },
  computed: {
    ...mapState({
      probe: state => state.pipeline.probe,
      imageAnalytics: state => state.pipeline.analyticList.imageAnalytics,
      videoAnalytics: state => state.pipeline.analyticList.videoAnalytics
    }),
    ...mapGetters(["queryParameters"]),
    tags: function() {
      if (this.labels.length == 0) return [];
      return this.labels.split(",").map(s => s);
    },
    acceptableFiles: function() {
      return {
        image: this.imageAnalytics.length > 0,
        video: this.videoAnalytics.length > 0,
        audio: this.videoAnalytics.length > 0
      };
    }
  },
  mounted() {
    this.files = null;
    this.$store.commit("resetAll");
    this.$store.commit("resetUpload");
  },
  beforeDestroy() {}
};
</script>

<style scoped>
#upload-container {
  height: 100%;
  width: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
  background-color: #ddd;
}
.v-wrapper {
  position: relative;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.upload-header {
  padding: 8px;
  flex-basis: 100px;
  border-bottom: 1px solid #cccccc;
}
.flexform {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.flexform .field {
  display: inline-flex;
  flex: 0 1 auto;
}
.upload-hint {
  margin: 8px;
  flex: none;
  flex-basis: 125px;
  color: #aaa;
  border: dashed 3px #cccccc;
  border-radius: 10px;
  transition: 0.5s;
}
.upload-hint:hover {
  border-color: #37cbff;
  color: #37cbff;
}

.hover {
  border-color: #37cbff;
  color: #37cbff;
}
form {
  position: relative;
  height: 100%;
}
.hint {
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
  position: absolute;
  font-size: 18px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.input-file {
  opacity: 0; /* invisible but it's there! */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.upload-content {
  min-height: 0px;
  flex: 1 1 auto;
  overflow-y: scroll;
  background: white;
}

.upload-footer {
  flex: none;
  flex-basis: 50px;
  background: white;
  border-top: 1px solid #cccccc;
  padding: 8px;
}

td.shrink,
th.shrink {
  white-space: nowrap;
  width: 1px;
  text-align: center;
}
.field {
  margin-right: 3px;
}
.tag {
  margin: 3px;
}
.centered-message {
  padding: 20%;
  height: 100%;
  width: 100%;
  text-align: center;
  font-size: 1.5em;
}
</style>
