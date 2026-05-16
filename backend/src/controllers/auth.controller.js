const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
});

exports.login = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json({
        message: 'Đăng nhập thành công',
        ...result
    });
});

exports.refresh = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
});

