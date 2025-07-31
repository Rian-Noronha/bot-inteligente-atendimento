const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const asyncHandler = require('../utils/asyncHandler');

const { protect } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.post('/', protect, asyncHandler(feedbackController.criarFeedback));
router.get('/', protect, isAdmin, asyncHandler(feedbackController.pegarTodosFeedbacks));

module.exports = router;