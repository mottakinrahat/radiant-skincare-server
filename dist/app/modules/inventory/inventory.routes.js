"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const inventory_controller_1 = require("./inventory.controller");
const router = express_1.default.Router();
router.get("/", inventory_controller_1.InventoryController.getInventory);
router.post("/adjust", inventory_controller_1.InventoryController.adjustStock);
router.get("/history", inventory_controller_1.InventoryController.getStockHistory);
router.get("/history/:productId", inventory_controller_1.InventoryController.getProductStockHistory);
exports.inventoryRoutes = router;
