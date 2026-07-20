function sendResponse(res, statusCode, message, data = null) {
	const isSuccess = statusCode >= 200 && statusCode < 300;
	const response = {
		status: statusCode,
		message,
		success: isSuccess,
	};
	
	if (data) {
		response.data = data;
	}
	
	return res.status(statusCode).json(response);
}

module.exports = { sendResponse };
