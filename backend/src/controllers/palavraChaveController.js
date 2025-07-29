const { PalavraChave } = require('../models');

/**
 * @description Pega todas as palavras-chave do banco de dados.
 */
exports.pegarTodasPalavrasChave = async (req, res) => {
    try {
        const palavrasChave = await PalavraChave.findAll({
            order: [['palavra', 'ASC']] 
        });
        res.status(200).json(palavrasChave);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar palavras-chave.', error: error.message });
    }
};

/**
 * @description Pega uma palavra-chave específica por ID.
 */
exports.pegarPalavraChavePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const palavraChave = await PalavraChave.findByPk(id);

        if (palavraChave) {
            res.status(200).json(palavraChave);
        } else {
            res.status(404).json({ message: 'Palavra-chave não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar palavra-chave.', error: error.message });
    }
};

/**
 * @description Cria uma única nova palavra-chave.
 * @note Geralmente não será usado diretamente pelo formulário de criação de documentos,
 * que usará a função 'encontrarOuCriarLote'.
 */
exports.criarPalavraChave = async (req, res) => {
    try {
        const { palavra } = req.body;
        if (!palavra) {
            return res.status(400).json({ message: 'O campo "palavra" é obrigatório.' });
        }

        // Evita duplicados, tratando a palavra para minúsculas
        const [novaPalavraChave, created] = await PalavraChave.findOrCreate({
            where: { palavra: palavra.trim().toLowerCase() }
        });

        if (created) {
            res.status(201).json(novaPalavraChave);
        } else {
            // Se a palavra já existe, retorna um conflito ou o item existente
            res.status(409).json({ message: 'Essa palavra-chave já existe.', data: novaPalavraChave });
        }

    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar palavra-chave.', error: error.message });
    }
};

/**
 * @description Recebe um array de palavras, encontra as que já existem,
 * cria as que são novas e retorna a lista completa.
 * @body { "palavras": ["fraude", "compra", "online"] }
 */
exports.encontrarOuCriarLote = async (req, res) => {
    const { palavras } = req.body;

    if (!palavras || !Array.isArray(palavras)) {
        return res.status(400).json({ message: 'O corpo da requisição deve conter um array de "palavras".' });
    }

    try {
        // Mapeia cada palavra do array para uma promessa de findOrCreate.
        // Isso normaliza os dados (trim e toLowerCase) antes de salvar.
        const promises = palavras.map(p => PalavraChave.findOrCreate({
            where: { palavra: p.trim().toLowerCase() },
            defaults: { palavra: p.trim().toLowerCase() }
        }));
        
        // Espera todas as operações no banco de dados terminarem.
        const results = await Promise.all(promises);

        // O resultado de findOrCreate é um array [instance, created].
        // Pegar apenas a instância do modelo.
        const palavrasChaveSalvas = results.map(result => result[0]);

        // Retorna a lista de objetos PalavraChave com seus IDs.
        res.status(200).json(palavrasChaveSalvas);

    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar palavras-chave em lote.', error: error.message });
    }
};

/**
 * @description Atualiza uma palavra-chave existente.
 */
exports.atualizarPalavraChave = async (req, res) => {
    try {
        const { id } = req.params;
        const { palavra } = req.body;

        const [atualizada] = await PalavraChave.update({ palavra }, {
            where: { id: id }
        });

        if (atualizada) {
            const palavraAtualizada = await PalavraChave.findByPk(id);
            res.status(200).json(palavraAtualizada);
        } else {
            res.status(404).json({ message: 'Palavra-chave não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar palavra-chave.', error: error.message });
    }
};

/**
 * @description Deleta uma palavra-chave do banco de dados.
 */
exports.deletarPalavraChave = async (req, res) => {
    try {
        const { id } = req.params;
        const deletada = await PalavraChave.destroy({
            where: { id: id }
        });

        if (deletada) {
            // HTTP 204 No Content é a resposta padrão para sucesso em DELETE sem corpo.
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Palavra-chave não encontrada.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar palavra-chave.', error: error.message });
    }
};
