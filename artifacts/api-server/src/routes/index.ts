import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
