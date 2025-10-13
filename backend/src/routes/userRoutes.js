const express = require('express');
const userController = require('../controllers/userController');
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/buscar', userController.searchUsers);
router.get('/amigos', userController.listFriends);
router.put('/perfil/foto', userController.updateProfilePhoto);
router.post('/:id/amigos', userController.addFriend);
router.get('/:id/perfil', userController.getProfile);
router.post('/plantas/:plantId/likes', communityController.togglePlantLike);
router.post('/plantas/:plantId/comentarios', communityController.createPlantComment);
router.post('/comentarios/:commentId/likes', communityController.toggleCommentLike);

module.exports = router;
