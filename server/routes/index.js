const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const probesController = require("../controllers/probesController");
const tagsController = require("../controllers/tagsController");
const uploadsController = require("../controllers/uploadsController");
const userController = require("../controllers/userController");
const facetsController = require("../controllers/facetsController");
const rotateController = require("../controllers/rotateController");
const configController = require("../controllers/configController");
const { catchErrors } = require("../handlers/errorHandlers");

router.get("/probes/:id", catchErrors(probesController.show));
router.delete("/probes/", catchErrors(probesController.deleteTagged));
router.delete("/probes/:id", catchErrors(probesController.deleteProbe));
router.put("/probes/:id/tags", catchErrors(probesController.tags.replace));
router.patch("/probes/:id/tags", catchErrors(probesController.tags.merge));
router.delete("/probes/:id/tags", catchErrors(probesController.tags.delete));
router.get(
  "/probes/",
  probesController.extractSortOptions,
  catchErrors(probesController.index)
);
router.get("/user", userController.show);
router.get("/facets", facetsController.index);
router.get("/config", configController.config);
router.get("/tags", catchErrors(tagsController.index));
router.get("/rotate", catchErrors(rotateController.rotate));
router.get("/analytics", catchErrors(analyticsController.index));
router.post(
  "/upload",
  uploadsController.upload,
  catchErrors(uploadsController.prepfile),
  catchErrors(uploadsController.preprocess),
  uploadsController.makeAudioVideo,
  uploadsController.extractTags,
  catchErrors(uploadsController.createImageRequest),
  catchErrors(uploadsController.createVideoRequest),
  catchErrors(uploadsController.submitDetection)
);
router.post(
  "/uploadURL",
  uploadsController.fromURL,
  catchErrors(uploadsController.prepfile),
  catchErrors(uploadsController.preprocess),
  uploadsController.makeAudioVideo,
  uploadsController.extractTags,
  catchErrors(uploadsController.createImageRequest),
  catchErrors(uploadsController.createVideoRequest),
  catchErrors(uploadsController.submitDetection)
);

module.exports = router;
