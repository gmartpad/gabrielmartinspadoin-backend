const router = require('express').Router();
const Usuario = require('../../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const multer = require('multer');

const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline)

const authConfig = require('../../config/auth.json');

const generateToken = (params = {}) => {
    return jwt.sign(params, authConfig.secret, {
        // expiresIn: 86400,
    })
}

// const generateEmailToken = (params = {}) => {
//     return jwt.sing(params, authConfig.email_secret, {
//         expiresIn: '1d'
//     })
// }

//Get all

//Create

const upload = multer();
router.route('/registrar').post(upload.single('file'), async (req, res) => {
    
    const {
        file: file,
        body: { nome_de_usuario, email, senha }
    } = req;

    if(await Usuario.findOne({nome_de_usuario}))
        return res.status(400).send({erro:`Usuário(a) com este nome de usuário(a) já existe`});

    if(await Usuario.findOne({email}))
        return res.status(400).send({erro:`Usuário(a) com este email já existe`});

    var fileName ='pfp_padrao.jpg'; 

    if(file !== null){
        
        const ogName = file.originalName;
        const name = ogName.split('.jpg')[0];

        if(file.detectedFileExtension !== '.jpg')
            return res.status(400).send({erro:"Imagem com formato inválido"});

        fileName = name + Math.floor(Math.random() * 1000) + Math.floor(Math.random() * 1000) + file.detectedFileExtension;

        await pipeline(file.stream, fs.createWriteStream(`${__dirname}/../../public/uploads/usuarios/images/${fileName}`))

    }

    const novoUsuario = await new Usuario({
        nome_de_usuario,
        imagem_de_perfil: fileName,
        email,
        senha,
    });

    novoUsuario.save();

    jwt.sign(
        {
            usuario: novoUsuario._id,
            senha: senha
        }, 
        authConfig.email_secret,
        {
            expiresIn: '1d'
        },
        async (err, emailToken) => {
            const link = `http://localhost:5000/usuarios/confirmacao/${emailToken}`;

            await mailer.sendMail({
                to: email,
                from: 'contato.gabrielmartinspadoin@gmail.com',
                subject: 'Confirmação de Email - Gabriel Martins Padoin',
                template: 'auth/confirmacao',
                context: { link }
            }, (err) => {
                if(err)
                    return res.status(400).send(`Erro aqui: ${err}`)
            
                // return res.send({jooj:token, jiij:now});
                // return;
            });

        },
    );

    return res.json({
        usuario: {
            nome_de_usuario,
            imagem_de_perfil: fileName,
            email
        },
        token: generateToken({id: novoUsuario._id})
    })

})

router.route('/autenticar').post(async (req, res) => {

    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email }).select('+confirmado').select('+senha');

    // console.log(usuario);

    if(!usuario.confirmado){
        return res.status(400).send({erro:`Usuário(a) não está confirmado(a). Cheque sua caixa de entrada pelo email de confirmação.`})
    }

    if(!usuario)
        return res.status(400).send({erro:`Não existe usuário com este email.`});

    if(!await bcrypt.compare(senha, usuario.senha))
        return res.status(400).send({erro:`Senha Incorreta.`});

    usuario.senha = undefined;

    const token = generateToken({id: usuario._id})

    return res.json({
        usuario, 
        token: token
    });

})

router.route('/confirmacao/:token').get(async (req, res) => {

    const { usuario: id, senha } = jwt.verify(req.params.token, authConfig.email_secret);

    let oldC;

    await Usuario.findById(id).select('+confirmado').select('+senha')
        .then(usuario => {

            // console.log(`usuario: ${usuario}`)

            oldC = usuario.confirmado;

            usuario.confirmado = true;
            usuario.senha = senha;

            // console.log(`usuario: ${usuario}`)


            usuario.save()
                .then(() => res.redirect(`http://localhost:3000`))
                .catch(err => res.status(400).json(`Erro 1: ${err}.`));

        })
        .catch(err => res.status(400).json(`Erro 2: ${err}.`));

    if(oldC === false){
        return res.redirect(`http://localhost:3000/login?c=1`);
    }else{
        return res.redirect(`http://localhost:3000/login`);
    }    

})

router.route('/esqueci_minha_senha').post(async (req, res) => {
    const { email } = req.body;

    try {

        const usuario = await Usuario.findOne({email})

        if(!usuario)
            res.status(400).send({erro: `Usuário com este email não encontrado`})

        jwt.sign(
            {
                usuario: usuario._id,
            }, 
            authConfig.email_secret,
            {
                expiresIn: '1d'
            },
            async (err, emailToken) => {

                // const token = crypto.randomBytes(20).toString('hex');

                const now = new Date();
                now.setHours(now.getHours() + 1);

                await Usuario.findByIdAndUpdate( usuario._id, {
                    '$set': {
                        tokenDeResetDaSenha: emailToken,
                        expiracaoDoTokenDeReset: now
                    }
                })

                const link = `http://localhost:3000/resetar-minha-senha/${emailToken}`;
    
                await mailer.sendMail({
                    to: email,
                    from: 'contato.gabrielmartinspadoin@gmail.com',
                    subject: 'Recuperação de Senha - Gabriel Martins Padoin',
                    template: 'auth/esqueci_minha_senha',
                    context: { link }
                }, (err) => {
                    if(err)
                        return res.status(400).send({erro: `Não pôde ser enviado o email do esqueci minha senha - ${err}`})
                })
    
            },
        );

        return res.send({
            mensagem: "Mensagem com o link de recuperação de senha enviado para seu email"
        });

    } catch (err) {
        res.status(400).send({erro: `Erro no 'Esqueci minha senha', tenta novamente`})
    }

})

router.route('/resetar_minha_senha_teste_usuario').post(async (req, res) => {
    const { token } = req.body;
    
    const { usuario: id } = jwt.verify(token, authConfig.email_secret, 
            (err, result) => { 
                return res.status(200).send({ err: err, result: result, }); 
            }
        );

    if(id !== undefined){
        await Usuario.findById({_id: id})
            .then(usuario => {
                res.send({
                    mensagem:true,
                    email:usuario.email,
                });
            })
            .catch(err => res.status(400).send({erro: err}))
    }
    
    
});

router.route('/resetar_minha_senha').post(async (req, res) => {
    const { email, token, senha } = req.body;

    try {
        const usuario = await Usuario.findOne({email})
            .select('+ tokenDeResetDaSenha expiracaoDoTokenDeReset')

        if(!usuario)
            return res.status(400).send({erro:`Usuário não encontrado`})

        if(await token !== usuario.tokenDeResetDaSenha)
            return res.status(400).send({erro:`Token inválido`})

        const now = new Date();

        if( now > usuario.expiracaoDoTokenDeReset)
            return res.status(400).send({erro:`Token expirado, gere um token novo`})

        usuario.senha = senha;

        await usuario.save();

        res.send({mensagem:`Sua senha foi atualizada!`});

    } catch (err) {
        res.status(400).send({erro:`Não foi possível resetar a senha, tente novamente`})
    }

})

//Read

router.route('/nduSearch/:nome_de_usuario').get((req, res) => {
    Usuario.find({nome_de_usuario: req.params.nome_de_usuario})
        .then(usuario => res.json(usuario))
        .catch(err => res.status(400).json(`Erro: ${err}`))
})

router.route('/idSearch/:id').get( async (req, res) => {
    const usuario = await Usuario.findOne({_id: req.params.id})
    // console.log(usuario);
    try{
        res.send({usuario});
    }catch (err){
        res.status(400).send({erro:`Não foi possível encontrar o usuário`})
    }
})

//Update

// router.route('/atualizar/:id').post((req, res) => {
//     Usuario.findById(req.params.id)
//         .then(usuario => {

//             nome_de_usuario = req.body.nome_de_usuario;
//             bio = req.body.bio;
//             imagem_de_perfil = req.body.imagem_de_perfil;
//             email = req.body.email;
//             senha = req.body.senha;

//             usuario.save()
//                 .then(() => res.json('Usuário atualizado'))
//                 .catch(err => res.status(400).json(`Erro: ${err}`))

//         })
//         .catch(err => res.status(400).json(`Erro: ${err}`))

// })

//Delete

// router.route('/:id').delete((req, res) => {
//     Usuario.findByIdAndDelete(req.params.id)
//         .then(() => res.json('Usuário deletado!'))
//         .catch(err => res.status(400).json(`Erro: ${err}`))
// });

module.exports = router;