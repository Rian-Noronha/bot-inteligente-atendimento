const express = require('express');
const router = express.Router();
const palavraChaveController = require('../controllers/palavraChaveController');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.get('/', protect, isAdmin, palavraChaveController.pegarTodasPalavrasChave);
router.get('/:id', protect, isAdmin, palavraChaveController.pegarPalavraChavePorId);
router.post('/', protect, isAdmin, palavraChaveController.criarPalavraChave);
router.put('/:id', protect, isAdmin, palavraChaveController.atualizarPalavraChave);
router.delete('/:id', protect, isAdmin, palavraChaveController.deletarPalavraChave);
router.post('/lote', protect, isAdmin, palavraChaveController.encontrarOuCriarLote);

module.exports = router;