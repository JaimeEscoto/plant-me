const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/usuarios', adminController.listUsers);
router.post('/usuarios/:userId/semillas', adminController.grantSeeds);
router.get('/config/event-types', adminController.listEventTypes);
router.post('/config/event-types', adminController.createEventType);
router.put('/config/event-types/:id', adminController.updateEventType);
router.delete('/config/event-types/:id', adminController.deleteEventType);
router.get('/config/event-categories', adminController.listEventCategories);
router.post('/config/event-categories', adminController.createEventCategory);
router.put('/config/event-categories/:id', adminController.updateEventCategory);
router.delete('/config/event-categories/:id', adminController.deleteEventCategory);

module.exports = router;
