const isAdmin = (req, res, next) => {

    console.log('\n--- EXECUTANDO MIDDLEWARE ISADMIN (OTIMIZADO) ---');

    try {
        // O middleware 'protect' já garante que req.user existe.
        // acesso direto  ao perfil que veio no payload do token JWT.
        const perfilDoUsuario = req.user.perfil;
        
        console.log('Verificando perfil do usuário via JWT:', JSON.stringify(perfilDoUsuario, null, 2));

        if (perfilDoUsuario && perfilDoUsuario.nome && perfilDoUsuario.nome.toLowerCase() === 'administrador') {
            console.log('VERIFICAÇÃO OK: Usuário é administrador. Acesso permitido.');
            next(); // Permite a passagem
        } else {
            console.log('ACESSO NEGADO: O perfil no token não é de administrador.');
            return res.status(403).json({ message: 'Acesso negado. Rota exclusiva para administradores.' });
        }

    } catch (error) {
        console.error('\n!!!!!!!! ERRO AO VERIFICAR PERFIL NO ISADMIN !!!!!!!!');
        console.error(error);
        res.status(500).json({ message: "Erro interno ao verificar permissões", error: error.message });
    }
};

module.exports = { isAdmin };