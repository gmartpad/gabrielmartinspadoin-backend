const router = require('express').Router();
const Certificado = require('../models/certificados.model');
const multer = require('multer');

const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);


//Get all

router.route('/').get((req, res) => {
    Certificado.find()
        .then(certificados => res.json(certificados))
        .catch(err => res.status(400).json(`Erro: ${err}`))
})

//Create

const upload = multer();
router.route('/registrar').post(upload.single('file'), async (req, res) => {

    const {
        file: file,
        body: { nome_do_certificado }
    } = req;

    // console.log(`file: ${file}`)
    // console.log(`nome_do_certificado: ${nome_do_certificado}`)

    if(await Certificado.findOne({nome_do_certificado}))
        return res.status(400).send({erro:`Certificado com este nome já existe`});

    let fileName;

    if(file !== null){    
        const ogName = file.originalName;
        const name = ogName.split('.jpg')[0];

        if(file.detectedFileExtension !== '.jpg')
            return res.status(400).send({erro:"Imagem com formato inválido"});

        fileName = name + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000) + file.detectedFileExtension;

        await pipeline(file.stream, fs.createWriteStream(`${__dirname}/../public/uploads/certificados/images/${fileName}`))
    }
    // console.log(`jeej: ${file}`);
    const novoCertificado = await new Certificado({
        nome_do_certificado,
        imagem_do_certificado: fileName,
    });

    novoCertificado.save()
        .then(() => res.send({mensagem:'Certificado adicionado!'}))
        .catch(err => res.status(400).send({erro:`Erro: ${err}`}))
});

//Read

router.route('/:id').get((req, res) => {
    Certificado.findById(req.params.id)
        .then(certificado => res.json(certificado))
        .catch(err => res.status(400).json(`Erro: ${err}`))
})

//Update

// router.route('/atualizar/:id').post((req, res) => {
//     Certificado.findById(req.params.id)
//         .then(certificado => {
//             nome_do_certificado = req.body.nome_do_certificado;

//             certificado.save()
//                 .then(() => res.json('Certificado atualizado!'))
//                 .catch(err => res.status(400).json(`Erro: ${err}`))
//         })
//         .catch(err => res.status(400).json(`Erro: ${err}`))
// })

//Delete 

router.route('/:id').delete((req, res) => {
    Certificado.findByIdAndDelete(req.params.id)
        .then(() => res.json('Certificado removido!'))
        .catch(err => res.status(400).json(`Erro: ${err}`))
})

module.exports = router;