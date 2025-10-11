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

module.exports = router;
