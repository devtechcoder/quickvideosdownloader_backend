import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { HomeController } from "../../controllers/App/HomeController";

import { body, param, query } from "express-validator";

class HomeRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
  }

  public post() {
    this.router.post("/", HomeController.getDownloadUrl.bind(HomeController));
  }
}

export default new HomeRouter().router;
