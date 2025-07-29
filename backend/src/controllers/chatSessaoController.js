const { ChatSessao, Usuario } = require('../models');
exports.iniciarSessao = async (req, res) => {
    try {
        const usuario_id = req.user.id;
        const novaSessao = await ChatSessao.create({
            usuario_id: usuario_id
        });

        res.status(201).json({ 
            message: 'Sessão iniciada com sucesso.',
            sessao: novaSessao 
        });

    } catch (error) {
        console.error("Erro ao iniciar sessão de chat:", error);
        res.status(500).json({ message: "Erro ao iniciar sessão de chat.", error: error.message });
    }
};

exports.encerrarSessao = async (req, res) => {
    try {
        const { id } = req.params;
        
        const sessao = await ChatSessao.findByPk(id);

        if (sessao) {
            sessao.registro_fim = new Date();
            await sessao.save();

            res.status(200).json({
                message: 'Sessão encerrada com sucesso.',
                sessao: sessao
            });
        } else {
            res.status(404).json({ message: 'Sessão de chat não encontrada.' });
        }
    } catch (error) {
        console.error("ERRO DETALHADO AO ENCERRAR SESSÃO:", error);
        res.status(500).json({ message: "Erro ao encerrar sessão de chat.", error: error.message });
    }
};
