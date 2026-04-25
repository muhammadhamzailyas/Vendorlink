const express = require("express");
const router = express.Router();
const taskController = require("../controller/taskcontroller");
const { authmiddleware } = require("../middleware/authmiddle");

// Apply middleware
router.use(authmiddleware);

// Define routes
router.post("/", taskController.createTask);
router.get("/company/my-tasks", taskController.getCompanyTasks);
router.get("/vendor/my-tasks", taskController.getVendorTasks);
router.get("/", taskController.getAllTasks);
router.get("/:id", taskController.getTaskById);
router.get("/:id/check-deletability", taskController.checkDeletability);
router.put("/:id", taskController.updateTask);
router.put("/:id/complete", taskController.completeTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
