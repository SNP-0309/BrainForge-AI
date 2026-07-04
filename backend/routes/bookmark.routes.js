const express = require('express');
const { getBookmarks, createBookmark, deleteBookmark } = require('../controllers/utility.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBookmarks)
  .post(createBookmark);

router.route('/:id')
  .delete(deleteBookmark);

module.exports = router;
