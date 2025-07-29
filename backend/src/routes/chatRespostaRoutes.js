const express = require('express');
const router = express.Router();
const chatRespostaController = require('../controllers/chatRespostaController');

router.post('/respostas', chatRespostaController.criarResposta);
router.get('/consultas/:consulta_id/resposta', chatRespostaController.pegarRespostaPorConsulta);

module.exports = router;
