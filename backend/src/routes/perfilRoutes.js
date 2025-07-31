const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler'); 
const perfilController = require('../controllers/perfilController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');


router.get('/todos', protect, isAdmin, asyncHandler(perfilController.pegarTodosPerfis));
router.get('/', protect, isAdmin, asyncHandler(perfilController.pegarPerfisPorPaginacao));
router.get('/:id', protect, isAdmin, asyncHandler(perfilController.pegarPerfilPorId));
router.post('/', protect, isAdmin, asyncHandler(perfilController.criarPerfil));
router.put('/:id', protect, isAdmin, asyncHandler(perfilController.atualizarPerfil));
router.delete('/:id', protect, isAdmin, asyncHandler(perfilController.deletarPerfil));

module.exports = router;