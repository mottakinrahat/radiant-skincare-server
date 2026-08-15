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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbandonedCartController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const trycatch_1 = require("../../../helpers/trycatch");
const sendResponse_1 = require("../../../helpers/sendResponse");
const abandonedCart_services_1 = require("./abandonedCart.services");
const createOrUpdateAbandonedCart = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield abandonedCart_services_1.AbandonedCartServices.createOrUpdateAbandonedCartInDB(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned cart saved successfully",
        data: result,
    });
}));
const getAbandonedCarts = (0, trycatch_1.catchAsync)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield abandonedCart_services_1.AbandonedCartServices.getAbandonedCartsFromDB();
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned carts retrieved successfully",
        data: result,
    });
}));
const convertAbandonedCart = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield abandonedCart_services_1.AbandonedCartServices.convertAbandonedCartInDB(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned cart status updated to CONVERTED",
        data: result,
    });
}));
const updateStatus = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { status: cartStatus } = req.body;
    const result = yield abandonedCart_services_1.AbandonedCartServices.updateStatusInDB(id, cartStatus);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned cart status updated successfully",
        data: result,
    });
}));
const updateFollowUpNote = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { followUpNote } = req.body;
    const result = yield abandonedCart_services_1.AbandonedCartServices.updateFollowUpNoteInDB(id, followUpNote);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Follow-up note updated successfully",
        data: result,
    });
}));
const deleteAbandonedCart = (0, trycatch_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield abandonedCart_services_1.AbandonedCartServices.deleteAbandonedCartFromDB(req.params.id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Abandoned cart record deleted successfully",
        data: null,
    });
}));
exports.AbandonedCartController = {
    createOrUpdateAbandonedCart,
    getAbandonedCarts,
    convertAbandonedCart,
    updateStatus,
    updateFollowUpNote,
    deleteAbandonedCart,
};
