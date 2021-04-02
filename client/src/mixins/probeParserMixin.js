import get from "lodash.get";
import path from "path";

import { getBaseUrl } from "@/helpers/urlBuilder";

const sourceDir = "input";

const fileType = {
  IMAGE: 0,
  VIDEO: 1
};

export const probeParserMixin = {
  data() {
    return {};
  },
  computed: {
    /* parsedProbe()  is used to centralized logic across across components that need to access data for the currently selected probe
     * parsedProbe() will return a JSON Object with several data fields
     * Data Returned:
     *
     * type => string value of the type of media...either "image" or "video"
     * source => source for the probe itself...either .img or  .mp4
     * thumbnail => source for the thumbnail of the probe to be displayed in the gallery...always .mp4
     * status => string value stating that the probe has completed parsing
     * name => string value for the name of the file uploaded
     * id =>  string value for the unique probe hash
     * galleryFusedScore => integer value for the 'fused score' of the probe...when performing a detectionListRequest the 'fused_score" value
     *                         will be populated which returns the fusion score of the currently selected fusion algorithm. This is only used for
     *                         display in the gallery
     * hasFused => boolean value for whether or not the currently selected probe has a fused score
     *
     *
     */

    parsedProbe() {
      const requestPaths = {
        uri: "req_resources[0].uri",
        type: "req_resources[0].type"
      };

      const imageUri = get(this.probe, requestPaths.uri, null);
      const videoUri = get(this.probe, requestPaths.uri, null);

      const type = get(this.probe, requestPaths.type, null);
      const info = {
        isImage: type.includes("image"),
        isVideo: type.includes("video")
      };

      if (info.isImage) {
        info.type = "image";
        info.source = this.imageUrl(imageUri);
        info.thumbnail = this.thumbnailUrl(imageUri, fileType.IMAGE);
      } else {
        info.type = "video";
        info.source = this.videoUrl(videoUri);
        info.originalSource = this.videoUrl(videoUri, { original: true });
        info.thumbnail = this.thumbnailUrl(videoUri, fileType.VIDEO);
      }

      info.status = "parsed";
      info.id = this.probe.id;
      info.md5 = this.probe.meta["Hash:md5"];
      info.name = this.probe.meta["File:FileName"];
      info.galleryFusedScore = this.fusedScore();
      info.hasFused = this.probe.has_fused;
      return info;
    }
  },
  methods: {
    imageUrl(uri) {
      const { file, workingURL } = this.urlHelper(uri);
      const relativePath = path.join(sourceDir, file);

      const { href } = new URL(relativePath, workingURL);
      return href;
    },

    videoUrl(uri, options = {}) {
      const { file, workingURL } = this.urlHelper(uri);
      const relativePath = options.original
        ? path.join(sourceDir, file)
        : path.join(sourceDir, "transcoded", file);

      const { href } = new URL(relativePath, workingURL);

      return options.original
        ? href
        : href.substring(0, href.lastIndexOf(".")) + ".mp4"; //transcoded video URLS are always .mp4
    },

    thumbnailUrl(uri, type) {
      const { file, workingURL } = this.urlHelper(uri);
      const relativePath = path.join(sourceDir, "thumbnails", file);

      const { href } = new URL(relativePath, workingURL);
      const ext = href.split(".").pop();

      /* All audio an video files generate an mp4 moving thumbnail */
      return type == fileType.VIDEO ? href.replace(ext, "mp4") : href;
    },

    urlHelper(uri) {
      /* Seperate uri at slashes (Windows or POSIX) and get filename from last index */
      const sep = uri.includes("/") ? "/" : "\\";
      const uriSeperated = uri.split(sep);
      const [fileName] = uriSeperated.slice(-1);

      return {
        file: fileName,
        workingURL: getBaseUrl()
      };
    },
    fusedScore() {
      const isValidScore = 0 <= this.probe.fused_scored <= 1;
      return isValidScore
        ? Math.floor(100 * (1 - this.probe.fused_score)) + "%"
        : "Error";
    }
  },
  watch: {}
};
