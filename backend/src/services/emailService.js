const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.enviarEmailRecuperacao = async (destinatario, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/pages/reset-password.html?token=${token}`;

    const mailOptions = {
        from: `"Verde Card" <${process.env.EMAIL_FROM}>`,
        to: destinatario,
        subject: 'Recuperação de Senha',
        html: `
            <h1>Recuperação de Senha</h1>
            <p>Você solicitou a redefinição da sua senha.</p>
            <p>Clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-weight: bold; color: #007bff;">Redefinir Minha Senha</a>
            <p>Este link irá expirar em 1 hora.</p>
            <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail de recuperação enviado para:', destinatario);
    } catch (error) {
        console.error('Erro ao enviar e-mail com Nodemailer:', error);
        throw new Error('Não foi possível enviar o e-mail de recuperação.');
    }
};