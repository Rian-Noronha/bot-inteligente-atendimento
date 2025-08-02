const { ChatSessao} = require('../models');

exports.iniciarSessao = async (req, res) => {
    const usuario_id = req.user.id;
    const novaSessao = await ChatSessao.create({
        usuario_id: usuario_id
    });

    res.status(201).json({ 
        message: 'Sessão iniciada com sucesso.',
        sessao: novaSessao 
    });
};

exports.encerrarSessao = async (req, res) => {
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
        throw { status: 404, message: 'Sessão de chat não encontrada.' };
    }
};