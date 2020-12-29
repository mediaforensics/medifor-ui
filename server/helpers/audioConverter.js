const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

exports.generateWaveFile = (applicationInputPath, probe) => {
  return new Promise((resolve, reject) => {
    console.log("Generating waveform file");
    const waveformFile = path.join(
      applicationInputPath,
      path.parse(probe.filename).name + ".png"
    );
    ffmpeg(probe.path)
      .on("error", err => {
        reject(err);
      })
      .on("end", () => {
        resolve(waveformFile);
      })
      .outputOptions(["-lavfi", "showwavespic=s=1024x800:colors=3298dc"])
      .save(waveformFile);
  });
};

exports.generateVideo = (waveformFile, applicationInputPath, probe) => {
  return new Promise((resolve, reject) => {
    console.log("Converting audio to video");
    const filename = path.parse(probe.filename).name + ".avi";
    const outputFile = path.join(applicationInputPath, filename);

    ffmpeg(waveformFile)
      .on("error", err => {
        reject(err);
      })
      .on("end", () => {
        resolve(filename);
      })
      .addInput(probe.path)
      .audioCodec("copy")
      .save(outputFile);
  });
};
