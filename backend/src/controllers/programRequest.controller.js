const programRequestService = require('../services/programRequest.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

/**
 * Gửi yêu cầu tham gia chương trình học private
 */
exports.requestAccess = catchAsync(async (req, res) => {
    const { programId, reason } = req.body;
    const userId = req.user.id;

    const newRequest = await programRequestService.requestAccess(userId, programId, reason);

    res.status(201).json({
        message: 'Gửi yêu cầu thành công, vui lòng chờ Admin phê duyệt',
        data: newRequest
    });
});

/**
 * Lấy danh sách yêu cầu đang chờ (Dành cho Admin/Manager)
 */
exports.getPendingRequests = catchAsync(async (req, res) => {
    const requests = await programRequestService.getPendingRequests();
    res.json(requests);
});

/**
 * Phê duyệt yêu cầu chương trình học
 */
exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedRequest = await programRequestService.approveRequest(id);
    res.json({ message: 'Đã phê duyệt lộ trình và mở khóa toàn bộ khóa học liên quan', data: updatedRequest });
});

/**
 * Từ chối yêu cầu
 */
exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedRequest = await programRequestService.rejectRequest(id);
    res.json({ message: 'Đã từ chối yêu cầu truy cập lộ trình', data: updatedRequest });
});

/**
 * Phê duyệt hàng loạt
 */
exports.approveBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const results = await programRequestService.approveBulk(ids);
    res.json({ message: `Đã xử lý phê duyệt hàng loạt lộ trình`, count: results.length });
});

/**
 * Từ chối hàng loạt
 */
exports.rejectBulk = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) throw new ApiError(400, 'ids array là bắt buộc');

    const results = await programRequestService.rejectBulk(ids);
    res.json({ message: `Đã xử lý từ chối hàng loạt lộ trình`, count: results.length });
});


