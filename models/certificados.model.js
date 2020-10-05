const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const certificadoSchema = new Schema({
    nome_do_certificado: {
		type: String,
		trim: true,
		unique: true,
		minlength: 3,
	},
	imagem_do_certificado: {
		type: String,
		trim: true,
	},
}, {
    timestamps: true,
});

const Certificado = mongoose.model('Certificado', certificadoSchema);

module.exports = Certificado;