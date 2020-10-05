const router = require('express').Router();
const Usuario = require('../../models/usuario.model');

const authMiddleware = require('../../middlewares/auth');
router.use(authMiddleware);

const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline)

const authConfig = require('../../config/auth.json');

const multer = require('multer');
const jwt = require('jsonwebtoken');


//------------------------------------

const generateToken = (params = {}) => {
    return jwt.sign(params, authConfig.secret, {
        // expiresIn: 86400,
    })
}

//------------------------------------


router.route('/').get((req, res) => {
    res.send({ok:true, user:req.userId});
});

router.route('/pfp_info').post(async (req, res) => {
    const { email } = req.body;

    const usuario = await Usuario.findOne({email});

    const pfp_padrao = `/usuarios/recursos/images/pfp_padrao.jpg`;
    
    if(!usuario)
        return res.status(400).send({
            pfp_path:pfp_padrao
        })

    const pfp_path = `/usuarios/recursos/images/${usuario.imagem_de_perfil}`;

    return res.send({
        pfp_path
    })

})

router.route('/info').post(async (req, res) => {
    const { email } = req.body;

    const usuario = await Usuario.findOne({email}).select('+senha');

    if(!usuario)
        return res.status(400).send({erro:"Nenhum Usuário encontrado"})

    return res.send({
        usuario
    })

})

const upload = multer();
router.route('/atualiza_info').post(upload.single('file'), async (req, res) => {
    
    const {
        file: file,
        body: { nome_de_usuario, oldEmail, email, senhaAtual }
    } = req;

    // console.log(`file: ${file}`)
    // console.log(`nome_de_usuario: ${nome_de_usuario}`);
    // console.log(`oldEmail: ${oldEmail}`)
    // console.log(`email: ${email}`);
    // console.log(`senhaAtual: ${senhaAtual}`);

    await Usuario.findOne({email: oldEmail}).select('+senha')
        .then(async usuario => {

            // console.log(`usuario: ${usuario}`)

            usuario.nome_de_usuario = nome_de_usuario;
            usuario.email = email;
            usuario.senha = senhaAtual;

            let fileName;

            // console.log('/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/')
            // console.log(file);
            // console.log(`file.originalName: ${file.originalName}`);
            // console.log('/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/-.-/')

            if(file !== null && file.originalName !== 'pfp_padrao.jpg'){

                const ogName = file.originalName;
                const name = ogName.split('.jpg')[0];

                if(file.detectedFileExtension !== '.jpg')
                    return res.status(400).json("Imagem com formato inválido");

                fileName = name + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000) + file.detectedFileExtension;

                await pipeline(file.stream, fs.createWriteStream(`${__dirname}/../../public/uploads/usuarios/images/${fileName}`))

            }else if(file === null && usuario.imagem_de_perfil !== undefined){
                fileName = usuario.imagem_de_perfil;
            }else{
                fileName = 'pfp_padrao.jpg'
            }
            
            // console.log(`fileName: ${fileName}`);
            // }

            // fileSetting();

            // console.log(usuario);

            await usuario.save()
                .then(() => {
                    return res.json({
                        mensagem: "Informações atualizadas com sucesso!",
                        usuario: {
                            nome_de_usuario,
                            imagem_de_perfil: fileName,
                            email
                        },
                        token: generateToken({id: usuario._id})
                    })
                })
                .catch(err => {
                    res.status(400).json(`Erro: ${err} - deu ruim`)
                })

        })
        .catch(err => res.status(400).json(`Erro: ${err} - deu menos ruim`))

})

router.route('/atualiza_senha').post((req, res) => {
    const { email, novaSenha } = req.body;

    // console.log(`email: ${email}`);
    // console.log(`novaSenha: ${novaSenha}`);

    Usuario.findOne({email}).select('+senha')
        .then(usuario => {

            // console.log(`usuario: ${usuario}`)

            usuario.senha = novaSenha;

            usuario.save()
                .then(() => res.json(`Senha atualizada!`))
                .catch(err => res.status(400).json(`Erro: ${err}`))

        })
        .catch(err => res.status(400).json(`Erro: ${err}`))

})

module.exports = router;