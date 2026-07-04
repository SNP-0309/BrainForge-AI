const Bookmark = require('../models/bookmark.model');
const Achievement = require('../models/achievement.model');
const UserAchievement = require('../models/user-achievement.model');
const Notification = require('../models/notification.model');
const sendResponse = require('../utils/ResponseWrapper');
const { NotFoundError, BadRequestError } = require('../utils/CustomError');

// Bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id }).populate('itemId');
    sendResponse(res, 200, 'Bookmarks retrieved successfully', bookmarks);
  } catch (error) {
    next(error);
  }
};

const createBookmark = async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;
    if (!['Lesson', 'Course', 'Note'].includes(itemType) || !itemId) {
      return next(new BadRequestError('Invalid bookmark item type or item ID'));
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      itemType,
      itemId,
    });

    sendResponse(res, 201, 'Bookmark created successfully', bookmark);
  } catch (error) {
    next(error);
  }
};

const deleteBookmark = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!bookmark) {
      return next(new NotFoundError('Bookmark not found'));
    }
    sendResponse(res, 200, 'Bookmark removed successfully');
  } catch (error) {
    next(error);
  }
};

// Achievements
const getAllAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find();
    sendResponse(res, 200, 'System achievements retrieved', achievements);
  } catch (error) {
    next(error);
  }
};

const getMyAchievements = async (req, res, next) => {
  try {
    const unlocked = await UserAchievement.find({ user: req.user._id }).populate('achievement');
    sendResponse(res, 200, 'Unlocked achievements retrieved', unlocked);
  } catch (error) {
    next(error);
  }
};

// Notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt');
    sendResponse(res, 200, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return next(new NotFoundError('Notification not found'));
    }
    sendResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookmarks,
  createBookmark,
  deleteBookmark,
  getAllAchievements,
  getMyAchievements,
  getNotifications,
  markNotificationRead,
};
