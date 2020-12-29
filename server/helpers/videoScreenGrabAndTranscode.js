const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { parentPort, workerData, threadId } = require("worker_threads");

/* The worker thread will execute the following function and resolve the promise
 * to the main thread upon completion
 *
 * workerData is passed in from the new Worker() constructor */
const videoScreenGrab = () => {
  console.time(`${threadId}`);
  parentPort.postMessage(
    `Creating moving thumbnail for video number ${threadId} `
  );

  const {
    probe,
    sourcePath,
    destinationPath,
    transcodedVideoPath,
    startTimeForScreenGrab,
    fragmentDurationInSeconds
  } = workerData;
  const folder = path.dirname(destinationPath);
  const filename = path.parse(sourcePath)["name"] + ".mp4";

  const checkHTML5BrowserCompatability = (probe, metadata) => {
    return (
      probe.originalname.includes("mp4") &&
      metadata.streams[0].codec_name == "h264" &&
      metadata.streams[0].pix_fmt === "yuv420p" &&
      (metadata.streams.length == 1 || // short circuit if no audio
        metadata.streams[1].codec_name == "aac" ||
        metadata.streams[1].codec_name == "mp3")
    );
  };

  ffmpeg.ffprobe(probe.path.toString(), (err, metadata) => {
    if (err) {
      console.error(err);
      return;
    }
    if (checkHTML5BrowserCompatability(probe, metadata)) {
      console.log("Video Uploaded");
    } else {
      console.log("Transcoding video");
      //https://stackoverflow.com/questions/49686244/ffmpeg-too-many-packets-buffered-for-output-stream-01
      //https://trac.ffmpeg.org/wiki/Encode/H.264
      const command = ffmpeg(probe.path)
        .addOutputOption("-max_muxing_queue_size 9999")
        .addOutputOption("-pix_fmt yuv420p");
      command.save(path.join(transcodedVideoPath, filename));
    }

    ffmpeg()
      .input(sourcePath)
      .inputOptions([`-ss ${startTimeForScreenGrab}`])
      .outputOptions([`-t ${fragmentDurationInSeconds}`])
      .output(path.join(folder, filename))
      .on("end", () => {
        console.timeEnd(`${threadId}`);
      })
      .on("error", error => console.log(error))
      .run();
  });
};

videoScreenGrab();
