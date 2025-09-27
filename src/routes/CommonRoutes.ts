import { Router } from "express";
import { CommonController } from "../controllers/CommonController";
import _RS from "../helpers/ResponseHelper";

class CommonRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
  }
}

export default new CommonRoutes().router;
