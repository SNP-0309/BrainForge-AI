const sendResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: successStatus(statusCode),
    message,
    data,
  });
};

const successStatus = (statusCode) => {
  return statusCode >= 200 && statusCode < 300;
};

module.exports = sendResponse;
