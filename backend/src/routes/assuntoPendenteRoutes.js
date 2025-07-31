const express = require('express');
const router = express.Router();
const assuntoPendenteController = require('../controllers/assuntoPendenteController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler');


router.get('/', protect, isAdmin, asyncHandler(assuntoPendenteController.pegarAssuntosPendentesPaginado));
router.get('/todos', protect, isAdmin, asyncHandler(assuntoPendenteController.pegarTodosAssuntosPendentes));


router.post('/', protect, isAdmin, asyncHandler(assuntoPendenteController.criarAssuntoPendente));

router.put('/:id', protect, isAdmin, asyncHandler(assuntoPendenteController.atualizarStatusAssunto));

router.delete('/:id', protect, isAdmin, asyncHandler(assuntoPendenteController.deletarAssuntoPendente));

module.exports = router;