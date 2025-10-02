import axios from "axios";
import { Request, Response, NextFunction } from "express";

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
        "x-rapidapi-key": "9131f27512msh0873404bc0ebcc0p1d4506jsn508e16e41fbd", // <-- Move to .env file
        "x-rapidapi-host": "all-in-one-media-downloader-api.p.rapidapi.com",
      },
    };

    try {
      console.log(`Fetching data from RapidAPI for: ${videoUrl}`);
      const response = await axios.request(options);

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
}
