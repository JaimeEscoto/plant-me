const express = require('express');
const economyController = require('../controllers/economyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/resumen', economyController.getEconomyOverview);
router.get('/semillas/historial', economyController.getSeedTransferHistory);
router.get('/accesorios', economyController.listAccessories);
router.post('/accesorios/:id/comprar', economyController.purchaseAccessory);
router.post('/accesorios/:id/vender', economyController.sellAccessory);
router.post('/accesorios/:id/transferir', economyController.createAccessoryTransfer);
router.post(
  '/accesorios/transferencias/:transferId/aceptar',
  economyController.acceptAccessoryTransfer
);
router.post(
  '/accesorios/transferencias/:transferId/rechazar',
  economyController.rejectAccessoryTransfer
);

router.post('/semillas/transferir', economyController.createSeedTransfer);
router.post('/semillas/:transferId/aceptar', economyController.acceptSeedTransfer);
router.post('/semillas/:transferId/rechazar', economyController.rejectSeedTransfer);

module.exports = router;
