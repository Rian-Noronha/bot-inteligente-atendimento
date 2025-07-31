const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler'); 

router.get('/', protect, asyncHandler(categoriaController.pegarCategoriasPorPaginacao));
router.get('/todas', protect, asyncHandler(categoriaController.pegarTodasCategorias));
router.get('/:id', protect, asyncHandler(categoriaController.pegarCategoriaPorId));

router.post('/', protect, isAdmin, asyncHandler(categoriaController.criarCategoria));
router.put('/:id', protect, isAdmin, asyncHandler(categoriaController.atualizarCategoria));
router.delete('/:id', protect, isAdmin, asyncHandler(categoriaController.deletarCategoria));

module.exports = router;