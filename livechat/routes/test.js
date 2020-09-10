const router = require('express').Router({ mergeParams: true });
const { catchErrors } = require('../handlers/errorHandlers');
const testController = require('../controllers/testController');

const auth = require('../middlewares/auth');
const hasRole = require('../middlewares/roleAuth');

router.post('/', auth, hasRole('delete_canned_response'), catchErrors(testController.test));

module.exports = router;
