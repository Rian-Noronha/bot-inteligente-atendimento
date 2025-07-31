const express = require('express');
const router = express.Router();
const palavraChaveController = require('../controllers/palavraChaveController');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.get('/', protect, isAdmin, asyncHandler(palavraChaveController.pegarTodasPalavrasChave));
router.get('/:id', protect, isAdmin, asyncHandler(palavraChaveController.pegarPalavraChavePorId));
router.post('/', protect, isAdmin, asyncHandler(palavraChaveController.criarPalavraChave));
router.put('/:id', protect, isAdmin, asyncHandler(palavraChaveController.atualizarPalavraChave));
router.delete('/:id', protect, isAdmin, asyncHandler(palavraChaveController.deletarPalavraChave));
router.post('/lote', protect, isAdmin, asyncHandler(palavraChaveController.encontrarOuCriarLote));

module.exports = router;