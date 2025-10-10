const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/buscar', userController.searchUsers);
router.get('/amigos', userController.listFriends);
router.post('/:id/amigos', userController.addFriend);
router.get('/:id/perfil', userController.getProfile);

module.exports = router;
