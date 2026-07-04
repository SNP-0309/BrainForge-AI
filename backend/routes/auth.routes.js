const express = require('express');
const { syncUser } = require('../controllers/auth.controller');
const { verifyFirebaseToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/sync', verifyFirebaseToken, syncUser);

module.exports = router;
