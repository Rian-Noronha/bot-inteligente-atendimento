const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler'); 


router.get('/', protect, isAdmin, asyncHandler(usuarioController.pegarTodosUsuarios));
router.get('/:id', protect, isAdmin, asyncHandler(usuarioController.pegarUsuarioPorId));

router.post('/', protect, isAdmin, asyncHandler(usuarioController.criarUsuario));
router.put('/:id', protect, isAdmin, asyncHandler(usuarioController.atualizarUsuario));

router.delete('/:id', protect, isAdmin, asyncHandler(usuarioController.deletarUsuario));

module.exports = router;