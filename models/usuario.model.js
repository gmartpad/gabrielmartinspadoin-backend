const mongoose = require('mongoose'); //requisitando mongoose para criar os models do banco de dados
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
	nome_de_usuario: {
		type: String,
		required: true,
	},
	imagem_de_perfil: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		unique: true,
		required: true,
		lowercase: true,
	},
	senha: {
		type: String,
		required: true,
		select: false
	},
	confirmado: {
		type: Boolean,
		default: false,
		select: false
	},
	tokenDeResetDaSenha: {
		type: String,
		select: false
	},
	expiracaoDoTokenDeReset: {
		type: Date,
		select: false
	},
}, {
    timestamps: true,
});

usuarioSchema.pre('save', async function(next){
	const hash = await bcrypt.hash(this.senha, 10);
	this.senha = hash;

	next();
})

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;