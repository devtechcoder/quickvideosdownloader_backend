import { Router } from "express";
import { HomeController } from "../../controllers/App/HomeController";

class HomeRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/getUrl", HomeController.getDownloadUrl);
  }

  public get() {
    this.router.get("/proxy-download", HomeController.proxyDownload);
    this.router.get("/proxy-image", HomeController.proxyImage);
  }
}

export default new HomeRouter().router;
