const roleService = require('../services/role.service');
const catchAsync = require('../utils/catchAsync');

exports.getRoles = catchAsync(async (req, res) => {
    const roles = await roleService.getRoles();
    res.json(roles);
});

exports.createRole = catchAsync(async (req, res) => {
    const role = await roleService.createRole(req.body);
    res.json({ message: 'Tạo vai trò mới thành công', role });
});

exports.updateRole = catchAsync(async (req, res) => {
    const { id } = req.params;
    const role = await roleService.updateRole(id, req.body);
    res.json({ message: 'Cập nhật vai trò thành công', role });
});

exports.deleteRole = catchAsync(async (req, res) => {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.json({ message: 'Đã xóa vai trò thành công' });
});
