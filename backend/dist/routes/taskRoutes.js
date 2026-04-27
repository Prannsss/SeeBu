"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const withAuth_1 = require("../middlewares/withAuth");
const requireRole_1 = require("../middlewares/requireRole");
const router = (0, express_1.Router)();
// Retrieve tasks
router.get('/', withAuth_1.withAuth, (0, requireRole_1.requireRole)(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController_1.taskController.getTasks);
// Update status (Assigned -> Accepted)
router.put('/:id', withAuth_1.withAuth, (0, requireRole_1.requireRole)(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController_1.taskController.updateTaskStatus);
// Complete task with Proof
router.post('/:id/complete', withAuth_1.withAuth, taskController_1.taskController.completeTask);
exports.default = router;
