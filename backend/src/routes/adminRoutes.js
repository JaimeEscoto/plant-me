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

module.exports = router;
