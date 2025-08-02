const { PalavraChave } = require('../models');
const { validarCamposObrigatorios } = require('../utils/validation'); 

/**
 * @description Pega todas as palavras-chave do banco de dados.
 */
exports.pegarTodasPalavrasChave = async (req, res) => {
    const palavrasChave = await PalavraChave.findAll({
        order: [['palavra', 'ASC']]
    });
    res.status(200).json(palavrasChave);
};

/**
 * @description Pega uma palavra-chave específica por ID.
 */
exports.pegarPalavraChavePorId = async (req, res) => {
    const { id } = req.params;
    const palavraChave = await PalavraChave.findByPk(id);

    if (palavraChave) {
        res.status(200).json(palavraChave);
    } else {
        throw { status: 404, message: 'Palavra-chave não encontrada.' };
    }
};

/**
 * @description Cria uma única nova palavra-chave.
 * @note Geralmente não será usado diretamente pelo formulário de criação de documentos,
 * que usará a função 'encontrarOuCriarLote'.
 */
exports.criarPalavraChave = async (req, res) => {
    const { palavra } = req.body;
    if (!validarCamposObrigatorios([palavra])) {
        throw { status: 400, message: 'O campo "palavra" é obrigatório.' };
    }

    // Evita duplicados, tratando a palavra para minúsculas
    const [novaPalavraChave, created] = await PalavraChave.findOrCreate({
        where: { palavra: palavra.trim().toLowerCase() }
    });

    if (created) {
        res.status(201).json(novaPalavraChave);
    } else {
        // Se a palavra já existe, lança um erro 409 (Conflito) que o errorHandler irá capturar.
        // O errorHandler já tem uma lógica específica para SequelizeUniqueConstraintError.
        throw { status: 409, message: 'Essa palavra-chave já existe.', data: novaPalavraChave };
    }
};

/**
 * @description Recebe um array de palavras, encontra as que já existem,
 * cria as que são novas e retorna a lista completa.
 * @body { "palavras": ["fraude", "compra", "online"] }
 */
exports.encontrarOuCriarLote = async (req, res) => {
    const { palavras } = req.body;

    if (!palavras || !Array.isArray(palavras) || palavras.length === 0) {
        throw { status: 400, message: 'O corpo da requisição deve conter um array não vazio de "palavras".' };
    }

    // Mapeia cada palavra do array para uma promessa de findOrCreate.
    const promises = palavras.map(p => PalavraChave.findOrCreate({
        where: { palavra: p.trim().toLowerCase() },
        defaults: { palavra: p.trim().toLowerCase() }
    }));
    
    // Espera todas as operações no banco de dados terminarem.
    const results = await Promise.all(promises);

    // Pegar apenas a instância do modelo (o resultado de findOrCreate é [instance, created]).
    const palavrasChaveSalvas = results.map(result => result[0]);

    res.status(200).json(palavrasChaveSalvas);
};

/**
 * @description Atualiza uma palavra-chave existente.
 */
exports.atualizarPalavraChave = async (req, res) => {
    const { id } = req.params;
    const { palavra } = req.body;

    if (!validarCamposObrigatorios([palavra])) {
        throw { status: 400, message: 'O campo "palavra" é obrigatório para atualização.' };
    }

    const [atualizada] = await PalavraChave.update({ palavra }, {
        where: { id: id }
    });

    if (atualizada) {
        const palavraAtualizada = await PalavraChave.findByPk(id);
        res.status(200).json(palavraAtualizada);
    } else {
        // Lança um erro 404 para item não encontrado.
        throw { status: 404, message: 'Palavra-chave não encontrada.' };
    }
};

/**
 * @description Deleta uma palavra-chave do banco de dados.
 */
exports.deletarPalavraChave = async (req, res) => {
    const { id } = req.params;
    const deletada = await PalavraChave.destroy({
        where: { id: id }
    });

    if (deletada) {
        res.status(204).send(); 
    } else {
        throw { status: 404, message: 'Palavra-chave não encontrada.' };
    }
};
