const YTDlpWrap = require("yt-dlp-wrap");
const path = require("path");
const fs = require("fs");

const ytDlpBinaryDir = path.join(__dirname, "../bin"); // Project root में 'bin' डायरेक्टरी
const ytDlpBinaryPath = path.join(ytDlpBinaryDir, "yt-dlp");

// सुनिश्चित करें कि डायरेक्टरी मौजूद है
if (!fs.existsSync(ytDlpBinaryDir)) {
  fs.mkdirSync(ytDlpBinaryDir, { recursive: true });
}

console.log(`Attempting to download yt-dlp to: ${ytDlpBinaryPath}`);

YTDlpWrap.downloadFromGithub(ytDlpBinaryPath)
  .then(() => console.log("yt-dlp downloaded successfully!"))
  .catch((err) => {
    console.error("Failed to download yt-dlp:", err);
    process.exit(1);
  });
