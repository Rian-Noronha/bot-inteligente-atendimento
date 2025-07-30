const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.get('/', protect, categoriaController.pegarCategoriasPorPaginacao);
router.get('/todas', protect, categoriaController.pegarTodasCategorias);
router.get('/:id', protect, categoriaController.pegarCategoriaPorId);


router.post('/', protect, isAdmin, categoriaController.criarCategoria);
router.put('/:id', protect, isAdmin, categoriaController.atualizarCategoria);
router.delete('/:id', protect, isAdmin, categoriaController.deletarCategoria);

module.exports = router;