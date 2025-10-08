const express = require('express');
const router = express.Router();
const gardenController = require('../controllers/gardenController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', gardenController.getGarden);
router.post('/planta', gardenController.createPlant);
router.get('/historial', gardenController.getHistory);
router.put('/planta/:id', gardenController.updatePlant);
router.delete('/planta/:id', gardenController.deletePlant);

module.exports = router;
