const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
	titulo: {
		type: String,
		trim: true,
		required: true,
	},
	slug: {
		type: String,
		trim: true,
		required: true,
	},
	autor_id: {
		type: String,
		trim: true,
		required: true,
		select: false,
	},
	data: {
        type: Date,
        default: Date.now,
        select: false,
	},
	thumbnail: {
		type: String,
		trim: true,		
	},
	conteudo: {
		type: String,
		trim: true,
		required: true,
	},
	comentarios: [{
		autor_comentario_id: {
			type: String,
			trim: true,
		},
		comentario_data: {
			type: Date,
			default: Date.now,
		},
		comentario_conteudo: {
			type: String,
			trim: true,
        },
	}]
}, {
    timestamps: true,
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;