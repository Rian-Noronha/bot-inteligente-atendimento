const express = require('express');
const router = express.Router();
const chatSessaoController = require('../controllers/chatSessaoController');
const { protect } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// 2. URL da rota corresponde ao que o frontend chama
// 3. middleware 'protect' é aplicado para garantir que apenas
//    utilizadores autenticados possam iniciar ou encerrar sessões.
router.post('/chat/iniciar-sessao', protect, asyncHandler(chatSessaoController.iniciarSessao));
router.put('/chat/encerrar-sessao/:id', protect, asyncHandler(chatSessaoController.encerrarSessao));

module.exports = router;
