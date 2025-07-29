const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

/**
 * @route   GET /api/relatorios/kpis
 * @desc    Obtém um conjunto de KPIs para o dashboard de relatórios.
 * Pode ser filtrado por ?data_inicio=AAAA-MM-DD&data_fim=AAAA-MM-DD
 * @access  Privado (Administrador)
 */
router.get('/kpis', protect, isAdmin, relatorioController.getKpis);


module.exports = router;