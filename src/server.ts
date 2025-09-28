import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { env } from "./environments/Env";
import Routes from "./routes/Routes";
import { NextFunction } from "express"; // यह अब express इम्पोर्ट से आ रहा है, इसलिए इसे हटाया जा सकता है
import YTDlpWrap from "yt-dlp-wrap";
import path = require("path");
import { ReqInterface, ResInterface } from "./interfaces/RequestInterface";
const axios = require("axios");
const app = express();
const cookieParser = require("cookie-parser");
// let’s you use the cookieParser in your application

export class Server {
  public app: express.Application = express();

  constructor() {
    this.setConfigurations();
    this.setRoutes();
    this.error404Handler();
    this.handleErrors();
  }

  setConfigurations() {
    this.setMongodb();
    this.enableCors();
    this.configBodyParser();
  }

  setMongodb() {
    mongoose
      .connect(env().dbUrl, {
        // useCreateIndex: true,
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        // useFindAndModify: false
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("Database connected");
      })
      .catch((e) => {
        console.log(e);
        console.log("failed");
      });
  }

  enableCors() {
    this.app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
  }

  configBodyParser() {
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.app.use(express.json({ limit: "10mb" }));
    this.app.set("view engine", "ejs");
  }

  setRoutes() {
    this.app.use((req: ReqInterface, res: ResInterface, next: express.NextFunction) => {
      res.startTime = new Date().getTime();
      console.log(`Api URL => ${req.url} (${req.method})`);
      console.log("request-body", req.body);
      next();
    });
    this.app.use("/api-doc", express.static(path.resolve(process.cwd() + "/apidoc")));
    this.app.use("/img", express.static(path.resolve(process.cwd() + "/assest/images")));
    this.app.use("/image", express.static(path.resolve(process.cwd(), "src", "uploads")));

    this.app.use("/api", Routes);

    // 2. यह एंडपॉइंट फाइल को डाउनलोड करने के लिए प्रॉक्सी का काम करेगा
    this.app.get("/api/proxy-download", async (req, res) => {
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
    });

    // 3. यह एंडपॉइंट इमेज को प्रॉक्सी करने के लिए है ताकि CORS की समस्या न हो
    this.app.get("/api/proxy-image", async (req, res) => {
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
    });
  }

  error404Handler() {
    this.app.use((req, res) => {
      res.status(404).json({
        message: "Route not found test",
        status: 404,
      });
    });
  }

  handleErrors() {
    this.app.use((error: any, req, res, next: NextFunction) => {
      const errorStatus = req.errorStatus;
      res.status(errorStatus || 500).json({
        message: error.message || "Something went wrong!!",
        statusText: error.statusText || "ERROR",
        status: errorStatus || 500,
        data: {},
      });
    });
  }
}
