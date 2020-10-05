const router = require('express').Router();

const authController = require('./usuariosControllers/authController');
const projectController = require('./usuariosControllers/projectController');

router.use(authController);
router.use(projectController);

module.exports = router;