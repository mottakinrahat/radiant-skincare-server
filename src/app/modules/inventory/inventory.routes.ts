import express from "express";
import { InventoryController } from "./inventory.controller";

const router = express.Router();

router.get("/", InventoryController.getInventory);
router.post("/adjust", InventoryController.adjustStock);
router.get("/history", InventoryController.getStockHistory);
router.get("/history/:productId", InventoryController.getProductStockHistory);

export const inventoryRoutes = router;
