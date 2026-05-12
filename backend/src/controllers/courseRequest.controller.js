const courseRequestService = require('../services/courseRequest.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Gửi yêu cầu tham gia khóa học private
 */
exports.requestAccess = catchAsync(async (req, res) => {
    const { courseId, reason } = req.body;
    const userId = req.user.id;

    const newRequest = await courseRequestService.requestAccess(userId, courseId, reason);

    res.status(201).json({
        message: 'Gửi yêu cầu thành công, vui lòng chờ Admin phê duyệt',
        data: newRequest
    });
});

/**
 * Lấy danh sách yêu cầu của bản thân
 */
exports.getMyRequests = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const requests = await courseRequestService.getMyRequests(userId);
    res.json(requests);
});

/**
 * Láy danh sách yêu cầu đang chờ (Dành cho Admin/Manager)
 */
exports.getPendingRequests = catchAsync(async (req, res) => {
    const requests = await courseRequestService.getPendingRequests();
    res.json(requests);
});

/**
 * Phê duyệt yêu cầu
 */
exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedRequest = await courseRequestService.approveRequest(id);
    res.json({ message: 'Đã phê duyệt và cấp quyền truy cập khóa học', data: updatedRequest });
});

/**
 * Từ chối yêu cầu
 */
exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedRequest = await courseRequestService.rejectRequest(id);
    res.json({ message: 'Đã từ chối yêu cầu truy cập', data: updatedRequest });
});

/**
 * Phê duyệt hàng loạt
 */
exports.approveBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const results = await courseRequestService.approveBulk(ids);
    res.json({ message: `Đã xử lý phê duyệt hàng loạt`, count: results.length });
});

/**
 * Từ chối hàng loạt
 */
exports.rejectBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const results = await courseRequestService.rejectBulk(ids);
    res.json({ message: `Đã xử lý từ chối hàng loạt`, count: results.length });
});


