const express = require('express');
const router = express.Router();
const chatConsultaController = require('../controllers/chatConsultaController');
const asyncHandler = require('../utils/asyncHandler'); 

// 1.  "porteiro" de segurança
const { protect } = require('../middlewares/authMiddleware');

// --- ROTAS PROTEGIDAS PARA CONSULTAS DO CHAT ---

// Aplique asyncHandler à função do controlador
router.post('/chat/consultas', protect, asyncHandler(chatConsultaController.criarConsultaEObterResposta));

// Aplique asyncHandler à função do controlador
router.get('/chat/consultas/:sessao_id', protect, asyncHandler(chatConsultaController.pegarConsultasPorSessao));

module.exports = router;
