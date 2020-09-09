const router = require('express').Router();
const { body } = require('express-validator');
const { catchErrors } = require('../handlers/errorHandlers');
const cannedResponseController = require('../controllers/cannedResponseController');

const auth = require('../middlewares/auth');

router.get('/', auth, catchErrors(cannedResponseController.read));
router.post('/', auth, [
  body('name').not().isEmpty().withMessage('Field is required'),
  body('text').not().isEmpty().withMessage('Field is required'),
  body('language').not().isEmpty().withMessage('Field is required'),
], catchErrors(cannedResponseController.create));

router.put('/', auth, [
  body('responseId').not().isEmpty().withMessage('Response ID is required'),
  body('updatedResponse').not().isEmpty().withMessage('Field is required'),
], catchErrors(cannedResponseController.edit));
router.delete('/', auth, [
  body('responseId').not().isEmpty().withMessage('Response ID is required'),
], catchErrors(cannedResponseController.delete));

module.exports = router;
