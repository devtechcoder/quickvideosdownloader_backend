import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { CONFIG } from "../../environments/config";

export class HomeController {
  static async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    const { videoUrl }: { videoUrl: string } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, error: "Video URL is required" });
    }

    const options = {
      method: "GET",
      url: "https://all-in-one-media-downloader-api.p.rapidapi.com/download",
      params: {
        url: videoUrl,
      },
      headers: {
        "x-rapidapi-key": CONFIG.RAPID_API_KEY,
        "x-rapidapi-host": "all-in-one-media-downloader-api.p.rapidapi.com",
      },
    };

    try {
      console.log(`Fetching data from RapidAPI for: ${videoUrl}`);
      const response = await axios.request(options);

      console.log("RapidAPI response:", response);

      // The response from the RapidAPI is sent directly.
      // You may need to adapt this data structure on your frontend.
      res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      console.error("RapidAPI call failed:", error);

      // Check if the error is from Axios and has response data
      if (axios.isAxiosError(error) && error.response) {
        // Forward the error from the external API if available
        return res.status(error.response.status).json({
          success: false,
          error: "Failed to fetch media information from the external service.",
          errorInfo: error,
          details: error.response.data,
        });
      }

      // Generic error for other cases
      res.status(500).json({
        success: false,
        error: "An internal server error occurred.",
      });
    }
  }

  static async proxyDownload(req: Request, res: Response, next: NextFunction) {
    const { url, title, format } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).send("URL is required and must be a string.");
    }

    try {
      const response = await axios({
        method: "get",
        url: decodeURIComponent(url as string),
        responseType: "stream",
      });

      const fileName = `${title || "download"}.${format || "mp4"}`;
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      response.data.pipe(res);
    } catch (error) {
      console.error("Proxy download error:", error.message);
      res.status(500).send("Failed to download the file.");
    }
  }

  static async proxyImage(req: Request, res: Response, next: NextFunction) {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).send("URL is required and must be a string.");
    }

    try {
      const decodedUrl = decodeURIComponent(url as string);
      console.log(`Proxying image from: ${decodedUrl}`);

      const response = await axios({
        method: "get",
        url: decodedUrl,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Referer: "https://www.instagram.com/",
        },
      });

      res.setHeader("Content-Type", response.headers["content-type"]);
      response.data.pipe(res);
    } catch (error) {
      console.error("Image proxy error:", error.message);
      res.status(500).send("Failed to proxy image.");
    }
  }
}
