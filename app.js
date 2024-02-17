const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
var cron = require('node-cron');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

const hlsOutputDirectory = './hlsoutput';
const playlistFilePath = './videos/broadcast-ready/playlist.txt';


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use('/stream', express.static(hlsOutputDirectory));

app.listen(PORT, () => {
  // Remove everything in the hlsOutputDirectory directory before starting a new stream: 
  cleanHLSOutput();
  console.log(`Server is running on port ${PORT}`);

  const ffmpegProcess = spawn('ffmpeg', [
    '-re',
    '-f', 'concat',
    '-safe', '0',
    '-i', playlistFilePath,
    '-start_number', '0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-ar', '48000',
    //'-af', 'loudnorm',
    '-vf', "movie=logo.png [watermark]; [in][watermark] overlay=W-w-10:H-h-10 [out]",
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '10',
    //'-hls_list_size', '0',
    //'-hls_flags', 'delete_segments+program_date_time',
    `${hlsOutputDirectory}/index.m3u8`
  ]);

  ffmpegProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });
});


function cleanHLSOutput() {
  const directory = hlsOutputDirectory;
  console.log("clearing hls directory...");
  const files = fs.readdirSync(directory);
  for (const file of files) {
    fs.unlinkSync(path.join(directory, file));
  }
}