const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.post('/', protect, feedbackController.criarFeedback);
router.get('/', protect, isAdmin, feedbackController.pegarTodosFeedbacks);

module.exports = router;