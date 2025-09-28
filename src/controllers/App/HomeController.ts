import * as mongoose from "mongoose";
import _RS from "../../helpers/ResponseHelper";
import YTDlpWrap from "yt-dlp-wrap";
import { Request, Response, NextFunction } from "express";
import path from "path";
// बाइनरी का पाथ प्रोजेक्ट रूट के सापेक्ष 'bin' डायरेक्टरी में सेट करें।
const ytDlpBinaryPath = path.join(process.cwd(), "yt-dlp");
const ytdlp = new YTDlpWrap(ytDlpBinaryPath);
export class HomeController {
  static async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    const { videoUrl }: { videoUrl: string } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, error: "Video URL is required" });
    }

    try {
      console.log(`Fetching metadata for: ${videoUrl}`);
      // Correctly call yt-dlp to get JSON metadata
      const stdout = await ytdlp.execPromise([
        videoUrl,
        "--dump-json", // Get metadata as a JSON object
        "--ignore-no-formats-error", // Don't error if only storyboards are found
        "--no-warnings",
      ]);

      console.log("stdout-->", stdout);

      if (!stdout) {
        throw new Error("yt-dlp did not return any data. This might be due to login requirements or a private/invalid URL.");
      }

      let metadataList;
      try {
        // Try parsing as a single JSON object first (most common case for single videos)
        metadataList = [JSON.parse(stdout)];
      } catch (e) {
        // If it fails, it might be a multi-line JSON output (e.g., Instagram gallery)
        const lines = stdout.trim().split("\n");
        metadataList = lines.map((line) => JSON.parse(line));
      }

      const metadata = metadataList[0] || {};
      const { title, uploader, extractor_key, thumbnails } = metadata;

      // Find the best thumbnail from the thumbnails array
      const bestThumbnail = thumbnails && Array.isArray(thumbnails) ? thumbnails.reduce((prev, current) => (prev.preference > current.preference ? prev : current)) : null;
      let thumbnail = bestThumbnail ? bestThumbnail.url : metadata.thumbnail;
      const media: any[] = [];

      const platform = extractor_key ? extractor_key.toLowerCase() : "unknown";

      console.log("platform-->", platform);
      // --- Platform-Specific Logic using if/else if ---
      if (platform === "youtube" || platform === "youtube:tab") {
        if (metadata.entries) {
          // This is a playlist, process each video in it
          metadata.entries.forEach((entry) => {
            if (entry.formats) {
              media.push(...HomeController.ytProcessFormats(entry.formats));
            }
          });
        } else {
          // This is a single video
          const data = HomeController.ytProcessFormats(metadata.formats);
          console.log("data1111-->", data);
          media.push(...data);
        }
      } else if (platform === "instagram") {
        // Instagram returns one JSON object per line for galleries
        metadataList.forEach((item) => {
          // For videos, process formats; for images, use the direct URL.
          if (item.formats) {
            media.push(...HomeController.processFormats(item.formats));
          } else if (item.url) {
            media.push({
              quality: item.height ? `${item.height}p` : "image",
              format: item.ext || "jpg",
              url: item.url,
              size: item.filesize,
              vcodec: "none",
              acodec: "none",
            });
          }
        });
      } else if (platform === "twitter" || platform === "pinterest") {
        // These platforms often return an 'entries' array even for a single item
        const entries = metadata.entries || (metadataList.length > 1 ? metadataList : []);
        if (entries.length > 0) {
          entries.forEach((entry) => {
            if (entry.formats) {
              // It's a video within the entry
              media.push(...HomeController.processFormats(entry.formats));
            } else if (entry.url) {
              // It's an image within the entry
              media.push({
                quality: entry.height ? `${entry.height}p` : "image",
                format: entry.ext || "jpg",
                url: entry.url,
                size: entry.filesize,
                vcodec: "none",
                acodec: "none",
              });
            }
          });
        } else if (metadata.formats) {
          // Fallback for a single video post without 'entries'
          media.push(...HomeController.processFormats(metadata.formats));
        }
      } else {
        // Generic fallback for other platforms (Facebook, TikTok, etc.)
        if (metadata.formats) {
          media.push(...HomeController.processFormats(metadata.formats));
        } else if (metadata.url) {
          media.push({
            quality: metadata.height ? `${metadata.height}p` : "source",
            format: metadata.ext || "jpg",
            url: metadata.url,
            size: metadata.filesize,
            vcodec: metadata.vcodec || "none",
            acodec: metadata.acodec || "none",
          });
        }
      }

      console.log("media-->", media);
      // Final fallback: if no media was found, use the thumbnail as a last resort.
      if (media.length === 0 && thumbnail) {
        media.push({ quality: "image", format: "jpg", url: thumbnail, vcodec: "none", acodec: "none" });
      }

      // Ensure thumbnail is set if it was missing
      if (!thumbnail && media.length > 0) thumbnail = media[0].url;

      res.json({
        success: true,
        title: title || "Untitled Media",
        thumbnail: thumbnail,
        uploader,
        platform,
        // Final de-duplication based on URL to ensure no identical URLs are sent.
        media: media.filter((item, index, self) => index === self.findIndex((t) => t.url === item.url)),
      });
    } catch (error) {
      console.log("error--->", error);
      res.status(500).json({ success: false, error: "Failed to fetch media information. The link might be invalid, private, or require login." });
    }
  }

  /**
   * Processes the 'formats' array from yt-dlp to extract and de-duplicate media links.
   * @param formats The formats array from a yt-dlp metadata object.
   * @returns A de-duplicated array of media objects.
   */
  private static processFormats(formats: any[]): any[] {
    if (!formats || !Array.isArray(formats)) {
      return [];
    }

    const processed = formats
      .filter((f) => f.url)
      .map((f) => ({
        quality: f.format_note || (f.height ? `${f.height}p` : "audio"),
        format: f.ext,
        url: f.url,
        // ✅ filesize correct kiya
        size: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec || "none",
        acodec: f.acodec || "none",
      }));

    // De-duplicate based on quality + format
    return processed.filter((item, index, self) => index === self.findIndex((t) => t.quality === item.quality && t.format === item.format));
  }

  private static ytProcessFormats(formats: any[]): any[] {
    if (!formats || !Array.isArray(formats)) {
      return [];
    }
    console.log("formats-->", formats);

    const processed = formats
      .filter((f) => f.url)
      .map((f) => ({
        quality: f.format_note || (f.height ? `${f.height}p` : "audio"),
        format: f.ext,
        url: f.url,
        // ✅ filesize fix
        size: f.filesize || f.filesize_approx || null,
        vcodec: f.vcodec || "none",
        acodec: f.acodec || "none",
      }));

    console.log("processed-->", processed);

    const data = processed.filter((item, index, self) => index === self.findIndex((t) => t.quality === item.quality && t.format === item.format));
    return data;
  }
}
