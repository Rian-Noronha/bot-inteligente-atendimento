const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');


router.post('/login', asyncHandler(authController.login));
router.post('/esqueci-senha', asyncHandler(authController.esqueciSenha));
router.post('/redefinir-senha', asyncHandler(authController.redefinirSenha));
router.post('/logout', protect, asyncHandler(authController.logout));
router.get('/me', protect, asyncHandler(authController.getMe));
router.put('/update-password', protect, asyncHandler(authController.updatePassword));

module.exports = router;