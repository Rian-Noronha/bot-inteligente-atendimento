const {
    ChatConsulta,
    ChatResposta,
    ChatSessao,
    AssuntoPendente,
    Feedback,
    Documento,
    Subcategoria,
    Categoria,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

exports.getKpis = async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        // Filtro de data genérico para a maioria das tabelas baseadas em 'createdAt'
        const filtroDeDataGeral = {};
        if (data_inicio && data_fim) {
            const dataFimAjustada = new Date(data_fim);
            dataFimAjustada.setHours(23, 59, 59, 999);
            filtroDeDataGeral.createdAt = {
                [Op.between]: [new Date(data_inicio), dataFimAjustada]
            };
        }

        // Filtro de data específico para a tabela de sessões, baseado no início do registro
        const filtroDeSessao = {};
        if (data_inicio && data_fim) {
            const dataFimAjustada = new Date(data_fim);
            dataFimAjustada.setHours(23, 59, 59, 999);
            filtroDeSessao.registro_inicio = {
                [Op.between]: [new Date(data_inicio), dataFimAjustada]
            };
        }

        const [
            totalConsultas,
            totalAssuntosPendentes,
            totalFeedbacks,
            totalFeedbacksUteis,
            dadosNotaMedia,
            dadosDuracaoMediaSessao,
            // Conta apenas as resoluções verdadeiras
            totalRespostasComFonte
        ] = await Promise.all([
            ChatConsulta.count({ where: filtroDeDataGeral }),
            AssuntoPendente.count({ where: filtroDeDataGeral }),
            Feedback.count({ where: filtroDeDataGeral }),
            Feedback.count({ where: { util: true, ...filtroDeDataGeral } }),
            Feedback.findOne({
                attributes: [[sequelize.fn('AVG', sequelize.col('nota')), 'notaMedia']],
                where: { nota: { [Op.not]: null }, ...filtroDeDataGeral }
            }),
            ChatSessao.findOne({
                attributes: [[sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (registro_fim - registro_inicio))')), 'duracaoMediaEmSegundos']],
                where: { registro_fim: { [Op.not]: null }, ...filtroDeSessao } // Usa o filtro de sessão
            }),
            ChatResposta.count({
                where: {
                    documento_fonte: { [Op.not]: null }, // Condição para uma resolução real
                    ...filtroDeDataGeral
                }
            })
        ]);
        
        // Usa a contagem de respostas com fonte
        const taxaResolucao = totalConsultas > 0 ? (totalRespostasComFonte / totalConsultas) * 100 : 0;
        const indiceRespostasUteis = totalFeedbacks > 0 ? (totalFeedbacksUteis / totalFeedbacks) * 100 : 0;
        const notaMedia = dadosNotaMedia ? parseFloat(dadosNotaMedia.get('notaMedia') || 0) : 0;
        const duracaoMedia = dadosDuracaoMediaSessao ? parseFloat(dadosDuracaoMediaSessao.get('duracaoMediaEmSegundos') || 0) : 0;

        const topTemasProblematicos = await AssuntoPendente.findAll({
            where: filtroDeDataGeral,
            include: [{
                model: ChatConsulta, as: 'consulta', attributes: [], required: true,
                include: [{
                    model: Subcategoria, as: 'subcategoria', attributes: [], required: true,
                    include: [{ model: Categoria, as: 'categoria', attributes: [] }]
                }]
            }],
            attributes: [
                [sequelize.col('consulta.subcategoria.categoria.nome'), 'tema'],
                [sequelize.fn('COUNT', sequelize.col('AssuntoPendente.id')), 'total']
            ],
            group: [sequelize.col('consulta.subcategoria.categoria.nome')],
            order: [[sequelize.literal('total'), 'DESC']],
            limit: 5
        });

        const topDocumentosUtilizados = await ChatResposta.findAll({
            where: { documento_fonte: { [Op.not]: null }, ...filtroDeDataGeral },
            include: [{ model: Documento, as: 'fonte', attributes: [], required: true }],
            attributes: [ 'documento_fonte', [sequelize.col('fonte.titulo'), 'titulo'], [sequelize.fn('COUNT', sequelize.col('ChatResposta.id')), 'total'] ],
            group: ['documento_fonte', sequelize.col('fonte.titulo')],
            order: [[sequelize.literal('total'), 'DESC']],
            limit: 5,
        });

        const totalSessoes = await ChatSessao.count({ where: filtroDeSessao }); // Usa o filtro de sessão

        const kpis = {
            performanceBot: {
                totalConsultas,
                taxaResolucao: parseFloat(taxaResolucao.toFixed(2)),
                taxaNaoSabe: totalConsultas > 0 ? parseFloat(((totalAssuntosPendentes / totalConsultas) * 100).toFixed(2)) : 0,
            },
            satisfacaoUsuario: {
                totalFeedbacks,
                indiceRespostasUteis: parseFloat(indiceRespostasUteis.toFixed(2)),
                notaMediaSatisfacao: parseFloat(notaMedia.toFixed(2))
            },
            engajamento: {
                totalSessoes,
                duracaoMediaSessaoSegundos: Math.round(duracaoMedia)
            },
            conteudo: {
                topTemasProblematicos,
                topDocumentosUtilizados
            }
        };

        res.status(200).json(kpis);

    } catch (error) {
        console.error("Erro ao calcular KPIs:", error);
        res.status(500).json({ message: "Erro interno no servidor ao gerar relatório.", error: error.message });
    }
};