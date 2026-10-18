"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController_1 = require("../controllers/locationController");
const cacheResponse_1 = require("../middlewares/cacheResponse");
const router = (0, express_1.Router)();
router.get('/', (0, cacheResponse_1.cacheResponse)('locations', 600), locationController_1.locationController.getLocations);
exports.default = router;
