FROM node:12

# Cria diretório do app
RUN mkdir -p /usr/app

# muda workdir
WORKDIR /usr/app

# Instala as dependências do app 
# O * é usado para assegurar que package.json E package-lock.json são copiados
# onde disponíveis (npm@5+)
COPY package*.json ./

RUN npm install

# Copia os arquivos ali pra dentro
COPY . /usr/app

EXPOSE 5000
CMD ["npm", "start"]