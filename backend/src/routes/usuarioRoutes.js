const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');


router.get('/', protect, isAdmin, usuarioController.pegarTodosUsuarios);
router.get('/:id', protect, isAdmin, usuarioController.pegarUsuarioPorId);


router.post('/', protect, isAdmin, usuarioController.criarUsuario);
router.put('/:id', protect, isAdmin, usuarioController.atualizarUsuario);


router.delete('/:id', protect, isAdmin, usuarioController.deletarUsuario);

module.exports = router;