"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const withAuth_1 = require("../middlewares/withAuth");
const router = (0, express_1.Router)();
// /api/v1/users/me (Get current logged in user)
router.get('/me', withAuth_1.withAuth, userController_1.userController.getCurrentUser);
router.patch('/me', withAuth_1.withAuth, userController_1.userController.updateCurrentUser);
router.delete('/me', withAuth_1.withAuth, userController_1.userController.deleteCurrentUser);
// /api/v1/users (Global view for super admins)
router.get('/', withAuth_1.withAuth, userController_1.userController.getAllUsers);
exports.default = router;
