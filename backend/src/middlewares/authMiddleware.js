const jwt = require('jsonwebtoken');
const { SessaoAtiva } = require('../models');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // VERIFICAÇÃO DE SESSÃO ATIVA
            const sessaoAtual = await SessaoAtiva.findOne({
                where: {
                    session_id: decoded.sessionId,
                    usuario_id: decoded.id
                }
            });

            // Se a sessão não for encontrada, o token é de uma sessão antiga e inválida.
            if (!sessaoAtual) {
                return res.status(401).json({ message: 'Sessão inválida. Por favor, inicie sessão novamente.' });
            }

            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token inválido ou sessão expirada.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};
