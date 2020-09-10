const router = require('express').Router({ mergeParams: true });
const { catchErrors } = require('../handlers/errorHandlers');
const testController = require('../controllers/testController');

const auth = require('../middlewares/auth');

router.post('/', auth, catchErrors(testController.test));

module.exports = router;
