const router = require('express').Router();
const { body } = require('express-validator');
const { catchErrors } = require('../handlers/errorHandlers');
const profileController = require('../controllers/profileController');

const auth = require('../middlewares/auth');
const hasPermission = require('../middlewares/roleAuth');

router.post('/picture', auth, [
  body('b64').not().isEmpty().withMessage('Field is required'),
  body('mimetype').not().isEmpty().withMessage('Field is required'),
  body('filename').not().isEmpty().withMessage('Field is required'),
], catchErrors(profileController.uploadProfilePicture));

module.exports = router;
