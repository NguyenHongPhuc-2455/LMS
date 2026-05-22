const DEFAULT_ALLOWED_ORIGINS = [
    'http://26.51.87.121:5174',
    'http://172.16.4.113:5174',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://localhost',
];

const parseOriginList = (value) => {
    if (!value) return [];
    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};

const allowedOrigins = [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...parseOriginList(process.env.FRONTEND_URL),
    ...parseOriginList(process.env.CORS_ORIGINS),
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

const isRailwayOrigin = (origin) => {
    return origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app');
};

const isOriginAllowed = (origin) => {
    return !origin || uniqueAllowedOrigins.includes(origin) || isRailwayOrigin(origin);
};

module.exports = {
    allowedOrigins: uniqueAllowedOrigins,
    isOriginAllowed,
};
