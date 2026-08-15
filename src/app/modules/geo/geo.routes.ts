import express from "express";
import { GeoController } from "./geo.controller";

const router = express.Router();

router.get("/divisions", GeoController.getDivisions);
router.get("/districts/:divisionName", GeoController.getDistricts);
router.get("/upazilas/:districtName", GeoController.getUpazilas);
router.get("/all-upazilas", GeoController.getAllUpazilas);
router.get("/delivery-charge", GeoController.getDeliveryCharge);

export const geoRoutes = router;
