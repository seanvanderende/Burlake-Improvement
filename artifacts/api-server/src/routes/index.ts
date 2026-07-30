import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import collectionsRouter from "./collections";
import adminRouter from "./admin";
import storageRouter from "./storage";
import brochuresRouter from "./brochures";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(brochuresRouter);

export default router;
