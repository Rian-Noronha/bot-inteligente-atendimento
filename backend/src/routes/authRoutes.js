const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');


router.post('/login', authController.login);
router.post('/esqueci-senha', authController.esqueciSenha);
router.post('/redefinir-senha', authController.redefinirSenha);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe); 
router.put('/update-password', protect, authController.updatePassword);

module.exports = router;