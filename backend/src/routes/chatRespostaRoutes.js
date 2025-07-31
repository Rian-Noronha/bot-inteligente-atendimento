const express = require('express');
const router = express.Router();
const chatRespostaController = require('../controllers/chatRespostaController');
const asyncHandler = require('../utils/asyncHandler'); 

router.post('/respostas', asyncHandler(chatRespostaController.criarResposta));
router.get('/consultas/:consulta_id/resposta', asyncHandler(chatRespostaController.pegarRespostaPorConsulta));

module.exports = router;
