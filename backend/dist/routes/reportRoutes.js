"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const withAuth_1 = require("../middlewares/withAuth");
const requireRole_1 = require("../middlewares/requireRole");
const router = (0, express_1.Router)();
// Retrieve multiple reports (filterable by query string: ?municipality_id=foo&status=In Review )
router.get('/', reportController_1.reportController.getReports);
// Retrieve a single report by ID
router.get('/:id', reportController_1.reportController.getReportById);
// Create a new report
router.post('/', reportController_1.reportController.createReport);
// Update a specific report (Status change)
router.put('/:id', withAuth_1.withAuth, (0, requireRole_1.requireRole)(['admin', 'superadmin']), reportController_1.reportController.updateReportStatus);
exports.default = router;
