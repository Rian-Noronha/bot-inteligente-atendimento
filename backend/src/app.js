const express = require('express');
const cors = require('cors');

const perfilRoutes = require('./routes/perfilRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const palavraChaveRoutes = require('./routes/palavraChaveRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const subcategoriaRoutes = require('./routes/subcategoriaRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const chatSessaoRoutes = require('./routes/chatSessaoRoutes');
const chatConsultaRoutes = require('./routes/chatConsultaRoutes');
const chatRespostaRoutes = require('./routes/chatRespostaRoutes');
const assuntoPendenteRoutes = require('./routes/assuntoPendenteRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes= require('./routes/authRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');

const app = express();
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Rota de autenticação (login, logout, etc.)
app.use('/api/auth', authRoutes);

// Rotas de gerenciamento de entidades (CRUDs)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfis', perfilRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/subcategorias', subcategoriaRoutes);
app.use('/api/palavras-chave', palavraChaveRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/assuntos-pendentes', assuntoPendenteRoutes);

// Rotas relacionadas ao fluxo do Chatbot
// Estas rotas já contêm o caminho completo internamente (ex: '/chat/iniciar-sessao'),
// então montá-las sob '/api' está correto.
app.use('/api', chatSessaoRoutes);
app.use('/api', chatConsultaRoutes);
app.use('/api', chatRespostaRoutes);

// Rota de relatórios de administrador
app.use('/api/relatorios', relatorioRoutes);


module.exports = app;