const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const { catchErrors } = require('../handlers/errorHandlers');
const cannedResponseController = require('../controllers/cannedResponseController');

const auth = require('../middlewares/auth');
const hasPermission = require('../middlewares/roleAuth');

router.get('/', auth, hasPermission('read_canned_response'), catchErrors(cannedResponseController.read));
router.post('/', auth, hasPermission('create_canned_response'), [
  body('text').not().isEmpty().withMessage('Field is required'),
  body('language').not().isEmpty().withMessage('Field is required'),
  body('category').not().isEmpty().withMessage('Field is required'),
], catchErrors(cannedResponseController.create));
router.put('/', auth, hasPermission('edit_canned_response'), [
  body('responseId').not().isEmpty().withMessage('Response ID is required'),
  body('updatedResponse').not().isEmpty().withMessage('Field is required'),
], catchErrors(cannedResponseController.edit));
router.delete('/', auth, hasPermission('delete_canned_response'), [
  body('responseId').not().isEmpty().withMessage('Response ID is required'),
], catchErrors(cannedResponseController.delete));

module.exports = router;
