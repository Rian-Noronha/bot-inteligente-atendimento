# Imagem base leve e recente do Node.js
FROM node:20-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia o package.json e package-lock.json primeiro.
# Aproveita o cache do Docker: as dependências só serão reinstaladas se estes arquivos mudarem.
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código da sua aplicação
COPY . .

# Expõe a porta 3000, que é a que seu servidor usa
EXPOSE 3000

# Comando padrão para iniciar o 'node server.js'
CMD [ "npm", "start" ]