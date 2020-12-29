const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
let fragmentDurationInSeconds = 4;
let startTimeInSeconds = 0;

/* Returns a single frame screenshot of the video */
exports.imageScreenGrab = (sourcePath, destinationPath, isAudioFile) => {
  const filename = path.parse(sourcePath)["name"] + ".jpg";
  const folder = path.dirname(destinationPath);

  const getStartTimeInSeconds = (
    videoDurationInSeconds,
    fragmentDurationInSeconds
  ) => {
    /* By subtracting the fragment duration we can be sure that the resulting
     * start time + fragment duration will be less than the video duration */
    const safeVideoDurationInSeconds =
      videoDurationInSeconds - fragmentDurationInSeconds;

    /* If the fragment duration is longer than the video duration just return video */
    if (safeVideoDurationInSeconds <= 0) {
      return 0;
    }

    return getRandomIntegerInRange(
      0.25 * safeVideoDurationInSeconds,
      0.75 * safeVideoDurationInSeconds
    );
  };

  /* Returns a random number of seconds between 25%-75% of the video */
  const getRandomIntegerInRange = (min, max) => {
    const minInt = Math.ceil(min);
    const maxInt = Math.floor(max);

    return Math.floor(Math.random() * (maxInt - minInt) + minInt);
  };

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(sourcePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      console.log("Creating image thumbnail for video");
      const { duration } = metadata.format;

      /* For audio files that were transcoded to video the metadata can get corrupted
       * and will return small decimal values for the duration
       *
       * Since we dont need to show a moving thumbnail for audio files we instead clip a short video
       * which will appear as a static image */
      if (!isAudioFile) {
        startTimeInSeconds = getStartTimeInSeconds(
          duration,
          fragmentDurationInSeconds
        );
      } else {
        fragmentDurationInSeconds = 1;
      }

      /* Resolve all of the info needed for the video_thumbnail worker thread */
      ffmpeg(sourcePath)
        .on("end", () => {
          resolve({
            sourcePath: sourcePath,
            destinationPath: destinationPath,
            startTimeForScreenGrab: startTimeInSeconds,
            fragmentDurationInSeconds: fragmentDurationInSeconds
          });
        })
        .on("error", function(err) {
          console.log("Cannot process video", err.message);
          reject(err);
        })
        .screenshots({
          folder,
          filename,
          timestamps: [startTimeInSeconds],
          fastSeek: true
        });
    });
  });
};
