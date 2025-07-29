const express = require('express');
const router = express.Router();
const chatConsultaController = require('../controllers/chatConsultaController');

// 1.  "porteiro" de segurança
const { protect } = require('../middlewares/authMiddleware');

// --- ROTAS PROTEGIDAS PARA CONSULTAS DO CHAT ---

// 2. rota principal do chatbot. 
//    - O URL '/chat/consultas' corresponde ao que o frontend (apiChatService) chama.
//    - A função chamada é 'criarConsultaEObterResposta', função orquestradora.
//    - O 'protect' garante que apenas utilizadores logados podem fazer perguntas.
router.post('/chat/consultas', protect, chatConsultaController.criarConsultaEObterResposta);

// 3. Rota para buscar o histórico de consultas de uma sessão .
router.get('/chat/consultas/:sessao_id', protect, chatConsultaController.pegarConsultasPorSessao);


module.exports = router;
