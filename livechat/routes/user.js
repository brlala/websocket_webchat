const router = require('express').Router();
const { body } = require('express-validator');
const { catchErrors } = require('../handlers/errorHandlers');
const userController = require('../controllers/userController');

const auth = require('../middlewares/auth');
const hasPermission = require('../middlewares/roleAuth');

router.post('/login', [
  body('email').isEmail().withMessage('Kindly provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Require a minimum password length of 8'),
], catchErrors(userController.login));

router.post('/register', auth, hasPermission('create_user'), [
  body('firstName').not().isEmpty().withMessage('Field is required'),
  body('lastName').not().isEmpty().withMessage('Field is required'),
  body('email').isEmail().withMessage('Kindly provide a valid email'),
], catchErrors(userController.register));

router.get('/validate/:token', catchErrors(userController.validate));
router.post('/create-password', [
  body('passwordOne').isLength({ min: 8 }).withMessage('Require a minimum password length of 8'),
  body('passwordTwo').isLength({ min: 8 }).withMessage('Require a minimum password length of 8'),
  body('token').not().isEmpty().withMessage('Require a minimum password length of 8'),
], catchErrors(userController.createPassword));

router.put('/tag', auth, hasPermission('edit_user_tag'), [
  body('id').not().isEmpty().withMessage('Field is required'),
  body('tags').isArray().withMessage('Expected Array[String]'),
], catchErrors(userController.addTag));

router.get('/tag', auth, hasPermission('read_user_tag'), [
  body('id').not().isEmpty().withMessage('Field is required'),
], catchErrors(userController.readTag));

module.exports = router;
