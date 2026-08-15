"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoRoutes = void 0;
const express_1 = __importDefault(require("express"));
const geo_controller_1 = require("./geo.controller");
const router = express_1.default.Router();
router.get("/divisions", geo_controller_1.GeoController.getDivisions);
router.get("/districts/:divisionName", geo_controller_1.GeoController.getDistricts);
router.get("/upazilas/:districtName", geo_controller_1.GeoController.getUpazilas);
router.get("/all-upazilas", geo_controller_1.GeoController.getAllUpazilas);
router.get("/delivery-charge", geo_controller_1.GeoController.getDeliveryCharge);
exports.geoRoutes = router;
