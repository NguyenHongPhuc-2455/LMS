const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');


exports.getUsers = catchAsync(async (req, res) => {
    const result = await userService.getUsers(req.query);
    res.json(result);
});

exports.getRoles = catchAsync(async (req, res) => {
    const roles = await userService.getRoles();
    res.json(roles);
});

exports.updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    await userService.updateUser(id, req.body);
    res.json({ message: 'Cập nhật thành công' });
});

exports.getProfile = catchAsync(async (req, res) => {
    const id = req.user.id;
    const user = await userService.getProfile(id);
    res.json(user);
});

exports.updateProfile = catchAsync(async (req, res) => {
    const id = req.user.id;
    const result = await userService.updateProfile(id, req.body);
    res.json({ message: 'Cập nhật hồ sơ thành công', user: result });
});

exports.createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.json({ message: 'Tạo người dùng mới thành công', user });
});

exports.deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    await userService.deleteUser(id, req.user.id);
    res.json({ message: 'Đã xóa người dùng thành công' });
});

exports.batchUpdateUsers = catchAsync(async (req, res) => {
    const { users } = req.body;
    if (!Array.isArray(users)) throw new ApiError(400, 'Dữ liệu không hợp lệ');

    const updates = users.map(u => userService.updateUser(u.id, u));
    await Promise.all(updates);
    res.json({ message: `Đã cập nhật thành công ${users.length} thành viên` });
});

exports.batchDeleteUsers = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) throw new ApiError(400, 'Dữ liệu không hợp lệ');

    await userService.deleteBatchUsers(ids, req.user.id);
    res.json({ message: `Đã xóa thành công ${ids.length} thành viên` });
});

exports.revokeCourseAccess = catchAsync(async (req, res) => {
    const { userId, courseId } = req.body;
    await userService.revokeCourseAccess(userId, courseId);
    res.json({ message: 'Đã thu hồi quyền truy cập khóa học thành công' });
});

exports.restoreUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    await userService.restoreUser(id);
    res.json({ message: 'Đã khôi phục tài khoản thành công' });
});

exports.toggleUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    await userService.toggleUserStatus(id, isActive);
    res.json({ message: 'Cập nhật trạng thái thành công' });
});

