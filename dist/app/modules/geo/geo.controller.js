"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoController = void 0;
const trycatch_1 = require("../../../helpers/trycatch");
const sendResponse_1 = require("../../../helpers/sendResponse");
const geo_service_1 = require("./geo.service");
const getDivisions = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield geo_service_1.GeoService.getDivisions();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Divisions retrieved successfully",
        data: result.data,
    });
}));
const getDistricts = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { divisionName } = req.params;
    const result = yield geo_service_1.GeoService.getDistricts(String(divisionName));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Districts retrieved successfully",
        data: result.data,
    });
}));
const getUpazilas = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { districtName } = req.params;
    const result = yield geo_service_1.GeoService.getUpazilas(String(districtName));
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Upazilas retrieved successfully",
        data: result.data,
    });
}));
const getAllUpazilas = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield geo_service_1.GeoService.getAllUpazilas();
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "All upazilas retrieved successfully",
        data: result.data,
    });
}));
const getDeliveryCharge = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { districtName, upazilaName } = req.query;
    const result = yield geo_service_1.GeoService.getDeliveryCharge(districtName, upazilaName);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Delivery charge calculated successfully",
        data: result.data,
    });
}));
exports.GeoController = {
    getDivisions,
    getDistricts,
    getUpazilas,
    getAllUpazilas,
    getDeliveryCharge,
};
