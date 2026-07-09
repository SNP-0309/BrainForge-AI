const express = require('express');
const { syncUser } = require('../controllers/auth.controller');
const { verifyFirebaseToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { syncUserSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/sync', verifyFirebaseToken, validate(syncUserSchema), syncUser);

module.exports = router;
