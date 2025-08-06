# Aplicação Vite
FROM node:20-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o código fonte do front-end
COPY . .

# Executa o comando de build de produção do Vite
RUN npm run build

# Estágio 2: Server - Serve os arquivos estáticos com Nginx
FROM nginx:stable-alpine

# Copia os arquivos gerados no build do estágio anterior para a pasta padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# O Nginx inicia automaticamente