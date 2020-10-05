const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../config/mail.json');

const transport = nodemailer.createTransport({
    // host,
    // port,
    // auth: {
    //   user,
    //   pass
    // }
    service: 'Gmail',
    auth: {
        user: 'contato.gabrielmartinspadoin@gmail.com',
        pass: '!Console21@'
    }
});

transport.use('compile', hbs({
    viewEngine: {
        defaultLayout: undefined,
        partialsDir: path.resolve('../backend/resources/mail/')
    },
    viewPath: path.resolve('../backend/resources/mail/'),
    extName: '.html',
}));

module.exports = transport;