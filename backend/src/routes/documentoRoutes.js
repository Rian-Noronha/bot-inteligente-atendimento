const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentoController');
const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler');


router.get('/', protect, isAdmin, asyncHandler(documentosController.pegarTodosDocumentos));
router.get('/:id', protect, isAdmin, asyncHandler(documentosController.pegarDocumentoPorId));
router.post('/', protect, isAdmin, asyncHandler(documentosController.criarDocumento));
router.put('/:id', protect, isAdmin, asyncHandler(documentosController.atualizarDocumento));
router.delete('/:id', protect, isAdmin, asyncHandler(documentosController.deletarDocumento));


module.exports = router;