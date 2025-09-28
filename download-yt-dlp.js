const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");
const ytDlpBinaryDir = path.join(__dirname, "bin"); // प्रोजेक्ट रूट में 'bin' डायरेक्टरी
const ytDlpBinaryPath = path.join(ytDlpBinaryDir, "yt-dlp");
// सुनिश्चित करें कि डायरेक्टरी मौजूद है
if (!fs.existsSync(ytDlpBinaryDir)) {
  fs.mkdirSync(ytDlpBinaryDir, { recursive: true });
}
console.log(`Attempting to download yt-dlp to: ${ytDlpBinaryPath}`);
YTDlpWrap.downloadFromGithub(ytDlpBinaryPath)
  .then(() => {
    console.log("yt-dlp downloaded successfully!");
    // Linux/macOS पर एक्जीक्यूट करने की अनुमति सेट करें
    if (process.platform !== "win32") {
      console.log("Setting execute permissions for yt-dlp...");
      fs.chmodSync(ytDlpBinaryPath, "755"); // rwxr-xr-x
      console.log("Permissions set successfully.");
    }
  })
  .catch((err) => {
    console.error("Failed to download yt-dlp:", err);
    process.exit(1);
  });
