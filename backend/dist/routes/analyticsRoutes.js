"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const withAuth_1 = require("../middlewares/withAuth");
const router = (0, express_1.Router)();
// /api/v1/analytics/superadmin
router.get('/superadmin', withAuth_1.withAuth, analyticsController_1.analyticsController.getSuperadminAnalytics);
// /api/v1/analytics/admin/:municipality_id
router.get('/admin/:municipality_id', withAuth_1.withAuth, analyticsController_1.analyticsController.getAdminAnalytics);
exports.default = router;
