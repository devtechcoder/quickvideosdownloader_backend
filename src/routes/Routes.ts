import { Router } from "express";
import CommonRoutes from "./CommonRoutes";

//App Routes
import HomeRouter from "./app/HomeRouter";

class Routes {
  public router: Router;
  constructor() {
    this.router = Router();
    this.app();
    this.common();
  }

  app() {
    this.router.use("/app", HomeRouter);
  }

  common() {
    this.router.use("/common", CommonRoutes);
  }
}
export default new Routes().router;
