const router = require('express').Router({ mergeParams: true });
const { catchErrors } = require('../handlers/errorHandlers');
const testController = require('../controllers/testController');

const auth = require('../middlewares/auth');
const hasRole = require('../middlewares/roleAuth');

router.post('/', auth, hasRole('delete_canned_response'), catchErrors(testController.test));
router.post('/email', auth, catchErrors(testController.email));
router.post('/search', auth, catchErrors(testController.search));

module.exports = router;
