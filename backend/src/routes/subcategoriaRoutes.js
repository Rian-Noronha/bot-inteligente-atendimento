const express = require('express');
const router = express.Router();

const subcategoriaController = require('../controllers/subcategoriaController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler');


router.get('/por-categoria/:categoriaId', protect, asyncHandler(subcategoriaController.pegarSubcategoriasPorCategoria));
router.get('/', protect, asyncHandler(subcategoriaController.pegarTodasSubcategorias));
router.get('/:id', protect, asyncHandler(subcategoriaController.pegarSubcategoriaPorId));

router.post('/', protect, isAdmin, asyncHandler(subcategoriaController.criarSubcategoria));
router.put('/:id', protect, isAdmin, asyncHandler(subcategoriaController.atualizarSubcategoria));
router.delete('/:id', protect, isAdmin, asyncHandler(subcategoriaController.deletarSubcategoria));

module.exports = router;