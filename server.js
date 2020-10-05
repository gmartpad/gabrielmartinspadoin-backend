const jwt = require('jsonwebtoken');
const authConfig = require('./config/auth.json');

//-----------------------------------------

//requisitando dependências necessárias para o funcionamento do backend
const express = require('express');
const cors = require('cors');

//-----------------------------------------

//requisitando o mongoose pra fazer a conexão com o banco de dados
const mongoose = require('mongoose')

//-----------------------------------------

//dotenv pra deixar arrumadinho as constantes do ambiente de desenvolvimento 
require('dotenv').config();

//-----------------------------------------

//criando o servidor Express
const app = express(); //criando o servidor
const port = process.env.port || 5000; //ditando em qual porta o servidor vai rodar

//-----------------------------------------

//middlewares
app.use(cors()); //habilitando cors
app.use(express.json());//habilitando o parse de json, pois terá muito envio e recebimento de json

//-----------------------------------------

//conexões ao banco do MongoDB Atlas

const uri = process.env.ATLAS_URI // uri do banco de dados que é oferecido no dashboard do MongoDB Atlas

mongoose.connect(uri, {

    useNewUrlParser:true, //ativar o parser de url de conexão com o banco
    useCreateIndex:true, //ativa o criação de indexes
    useUnifiedTopology: true,
    useFindAndModify: false

});

const connection = mongoose.connection;// instância da conexão para poder manipular dados da própria conexão

connection.once('open', () => { //quando a conexão ocorrer
    console.log('Conexão com o MongoDB Atlas realizada com sucesso.')
})

//-----------------------------------------

//Routes

const certificadosRouter = require('./routes/certificados');
// const authController = require('./routes/authController');
// const projectController = require('./routes/projectController')
const usuariosRouter = require('./routes/usuarios');
const postsRouter = require('./routes/posts');

app.use('/certificados', certificadosRouter);
app.use('/usuarios', usuariosRouter);
app.use('/posts', postsRouter);
// app.use('/usuarios', { authController, projectController })

//-----------------------------------------

// app.use(express.static('public/uploads/usuarios'));

app.use('/usuarios/recursos', express.static('public/uploads/usuarios'));
app.use('/certificados/recursos', express.static('public/uploads/certificados'));
app.use('/posts/recursos', express.static('public/uploads/posts'));

//-----------------------------------------

//inicia e escuta o server
app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`)
})

//-----------------------------------------