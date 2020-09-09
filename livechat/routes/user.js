const router = require('express').Router();
const { body } = require('express-validator');
const { catchErrors } = require('../handlers/errorHandlers');
const userController = require('../controllers/userController');

router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
], catchErrors(userController.login));

router.post('/register', [
  body('firstName').not().isEmpty().withMessage('Field is required'),
  body('lastName').not().isEmpty().withMessage('Field is required'),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
], catchErrors(userController.register));

module.exports = router;
