const router = require('express').Router();
const Post = require('../models/post.model');
const Usuario = require('../models/usuario.model');
const multer = require('multer');

const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);

// const authMiddleware = require('../middlewares/auth');
// router.use(authMiddleware);

//Posts

//Pega todos

router.route('/').get((req, res) => {
    Post.find().sort('-createdAt').select('+autor_id')
        .then(posts => res.json(posts))
        .catch(err => res.status(400).send({erro: `Erro: ${err}`}))
})

//Create

const upload = multer();
router.route('/registrar').post(upload.single('file'), async (req, res) => {

    const {
        file: file,
        body: { titulo, slug, autor, autor_id, conteudo }
    } = req;

    // console.log(autor);
    // console.log(autor_id);

    if(!await Usuario.findById({_id: autor_id}))
        return res.status(400).send({erro: `Autor do post é invalido`})

    if(await Post.findOne({slug}))
        return res.status(400).send({erro: `Já existe post com este nome!`})

    let fileName;

    if(file !== null){    
        const ogName = file.originalName;
        const name = ogName.split('.jpg')[0];

        if(file.detectedFileExtension !== '.jpg')
            return res.status(400).send({erro:"Imagem com formato inválido"});

        fileName = name + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000) + file.detectedFileExtension;

        await pipeline(file.stream, fs.createWriteStream(`${__dirname}/../public/uploads/posts/images/${fileName}`))
    }

    const novoPost = new Post({
        titulo,
        slug,
        autor,
        autor_id,
        thumbnail: fileName,
        conteudo,
    });

    novoPost.save()
        .then(() => res.send({mensagem: `Post adicionado com sucesso!`}))
        .catch(err => res.status(400).send({erro:`Erro: ${err}`}))

});

//Read

router.route('/:slug').get((req, res) => {
    Post.find({slug: req.params.slug}).select('+autor_id')
        .then(post => {
            // console.log('veev')
            res.json(post)
        })
        .catch(err => {
            // console.log('leel')
            res.status(400).send(`Erro: ${err}`)
        })
});

router.route('/thumbnail_info').post(async (req, res) => {
    const { slug } = req.body;

    // console.log(slug);

    const post = await Post.findOne({slug});

    const thumbnail_padrao = `/posts/recursos/images/pfp_padrao.jpg`;
    
    if(!post)
        return res.status(400).send({
            thumbnail_path:thumbnail_padrao
        })

    const thumbnail_path = `/posts/recursos/images/${post.thumbnail}`;

    return res.send({
        thumbnail_path
    })

})

//Update

router.route('/atualizar/:slug').post(upload.single('file'), async (req, res) => {

    const {
        file: file,
        body: { titulo, slug, conteudo, constNome_PFP, nome_PFP }
    } = req;


    await Post.findOne({slug: req.params.slug})
        .then(async post => {

            post.titulo = titulo
            post.slug = slug
            post.conteudo = conteudo
            

            // console.log('/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/')
            // console.log(`constNome_PFP: ${constNome_PFP}`);
            // console.log(`nome_PFP: ${nome_PFP}`);
            // console.log(file)
            // console.log(file);
            // console.log(`file.originalName: ${file.originalName}`);
            // console.log('/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/')

            if(file !== null && nome_PFP !== 'pfp_padrao.jpg' && nome_PFP !== undefined){
                const ogName = file.originalName;
                const name = ogName.split('.jpg')[0];
        
                if(file.detectedFileExtension !== '.jpg')
                    return res.status(400).send({erro:"Imagem com formato inválido"});
        
                fileName = name + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000) + file.detectedFileExtension;

                await pipeline(file.stream, fs.createWriteStream(`${__dirname}/../public/uploads/posts/images/${fileName}`))

                post.thumbnail = fileName;

            }else if(file === null){
                // console.log('jiuj');

                post.thumbnail = constNome_PFP;

            }         

            await post.save()
                .then(() => res.send({mensagem: `Post atualizado!`}))
                .catch(err => res.status(400).send({erro: `Erro: ${err}`}))
        })
        .catch(err => res.status(400).send({erro: `Erro: ${err}`}))
})

router.route('/atualizarComentarios/:slug').post(async (req, res) => {

    const { _id, seuComentario } = req.body;

    // console.log(`_id:${_id}`)
    // console.log(`seuComentario:${seuComentario}`)

    await Post.findOne({slug: req.params.slug})
        .then(async post => {

            // console.log(`post:${post}`)

            let novoComentarios = post.comentarios;

            let novoComentario = {
                autor_comentario_id: _id,
                comentario_conteudo: seuComentario
            }

            novoComentarios.push(novoComentario);

            post.comentarios = novoComentarios;

            await post.save()
                .then(() => res.send({mensagem: `Comentário Enviado`, post}))
                .catch(err => res.status(400).send({erro: `Erro: ${err}`}))

        })
        .catch(err => res.status(400).send({erro: `Erro: ${err}`}))
})  

//Delete 

router.route('/deletarComentario/:slug').post(async (req, res) => {

    const { _id } = req.body;

    // console.log(_id)

    await Post.findOne({slug: req.params.slug})
        .then(async post => {

            // console.log(post);

            let novosComentarios = post.comentarios;

            let comentarioEscolhido = novosComentarios.filter(obj => {
                if(obj._id == _id){
                    return obj;
                }
            });

            // console.log(comentarioEscolhido[0])

            let indexComentario = novosComentarios.indexOf(comentarioEscolhido[0]);

            if (indexComentario > -1) {
                novosComentarios.splice(indexComentario, 1);
            }

            post.comentarios = novosComentarios;

            await post.save()
                .then(() => res.send({mensagem: `Comentário Removido`, post}))
                .catch(err => res.status(400).send({erro: `Erro: ${err}`}))

        })
        .catch(err => res.status(400).send({erro: `Erro: ${err}`}))
})

router.route('/:id').delete((req, res) => {
    Post.findByIdAndDelete(req.params.id)
        .then(() => res.send({mensagem: `Post removido!`}))
        .catch(err => res.status(400).json(`Erro: ${err}`))
})

//Comentários

module.exports = router;