const { Usuario, Perfil } = require('../models');

const isAdmin = async (req, res, next) => {
    // log depuração
    console.log('\n--- EXECUTANDO MIDDLEWARE ISADMIN ---');
    
    try {
        if (!req.user || !req.user.id) {
            console.error('ERRO: Middleware "protect" não adicionou req.user.id corretamente.');
            return res.status(401).json({ message: 'Falha na autenticação, dados do usuário não encontrados.' });
        }
        
        const idDoUsuarioLogado = req.user.id;
        console.log(`Buscando permissões para o usuário com ID: ${idDoUsuarioLogado}`);

        const usuario = await Usuario.findByPk(idDoUsuarioLogado, {
            include: [{
                model: Perfil,
                as: 'perfil',
                attributes: ['nome']
            }]
        });
        
        console.log('Resultado da busca no banco:', JSON.stringify(usuario, null, 2));

        if (usuario && usuario.perfil && usuario.perfil.nome) {
            console.log(`Perfil encontrado: '${usuario.perfil.nome}'. Verificando se é 'administrador'.`);
            if (usuario.perfil.nome.toLowerCase() === 'administrador') {
                console.log('VERIFICAÇÃO OK: Usuário é administrador. Acesso permitido.');
                next(); // Permite a passagem
            } else {
                console.log('ACESSO NEGADO: Usuário não é administrador.');
                return res.status(403).json({ message: 'Acesso negado. Rota exclusiva para administradores.' });
            }
        } else {
            console.log('ACESSO NEGADO: Usuário ou perfil não encontrado no resultado da busca.');
            return res.status(403).json({ message: 'Acesso negado. Perfil de usuário não pôde ser verificado.' });
        }

    } catch (error) {
        console.error('\n!!!!!!!! ERRO DETALHADO CAPTURADO NO ISADMIN !!!!!!!!');
        console.error(error);
        
        res.status(500).json({ message: "Erro interno ao verificar permissões de administrador", error: error.message });
    }
};

module.exports = { isAdmin };