const express = require('express');
const router = express.Router();
const assuntoPendenteController = require('../controllers/assuntoPendenteController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');


router.get('/', protect, isAdmin, assuntoPendenteController.pegarAssuntosPendentes);


router.post('/', protect, isAdmin, assuntoPendenteController.criarAssuntoPendente);


router.put('/:id', protect, isAdmin, assuntoPendenteController.atualizarStatusAssunto);
router.delete('/:id', protect, isAdmin, assuntoPendenteController.deletarAssuntoPendente);

module.exports = router;