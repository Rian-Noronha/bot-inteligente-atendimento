const express = require('express');
const router = express.Router();

const perfilController = require('../controllers/perfilController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');


router.get('/', protect, isAdmin, perfilController.pegarTodosPerfis);
router.get('/:id', protect, isAdmin, perfilController.pegarPerfilPorId);
router.post('/', protect, isAdmin, perfilController.criarPerfil);
router.put('/:id', protect, isAdmin, perfilController.atualizarPerfil);
router.delete('/:id', protect, isAdmin, perfilController.deletarPerfil);

module.exports = router;