import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import collectionsRouter from "./collections";
import adminRouter from "./admin";
import storageRouter from "./storage";
import brochuresRouter from "./brochures";
import priceListsRouter from "./priceLists";
import applicationsRouter from "./applications";
import orderFormsRouter from "./orderForms";
import portalSettingsRouter from "./portalSettings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(brochuresRouter);
router.use(priceListsRouter);
router.use(applicationsRouter);
router.use(orderFormsRouter);
router.use(portalSettingsRouter);

export default router;
