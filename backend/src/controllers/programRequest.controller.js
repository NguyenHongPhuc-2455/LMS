const programRequestService = require('../services/programRequest.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const prisma = require('../configs/prisma');

const getManagerDepartmentId = async (req) => {
    const userRoles = req.user?.roles || [];
    const roleNames = userRoles.map((r) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');
    
    if (!isManagerOnly) return { isManagerOnly: false, departmentId: null };

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { department_id: true }
    });
    return { isManagerOnly: true, departmentId: user?.department_id || null };
};

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
    const { page, limit } = req.query;
    const { departmentId } = await getManagerDepartmentId(req);
    const requests = await programRequestService.getPendingRequests(
        departmentId,
        page ? parseInt(page) : null,
        limit ? parseInt(limit) : null
    );
    res.json(requests);
});

/**
 * Phê duyệt yêu cầu chương trình học
 */
exports.approveRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { departmentId: managerDeptId } = await getManagerDepartmentId(req);
    const updatedRequest = await programRequestService.approveRequest(id, managerDeptId);
    res.json({ message: 'Đã phê duyệt lộ trình và mở khóa toàn bộ khóa học liên quan', data: updatedRequest });
});

/**
 * Từ chối yêu cầu
 */
exports.rejectRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { departmentId: managerDeptId } = await getManagerDepartmentId(req);
    const updatedRequest = await programRequestService.rejectRequest(id, managerDeptId);
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


