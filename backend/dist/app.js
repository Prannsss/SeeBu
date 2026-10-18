"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
// Load variables (resolve from this file, not cwd, so it works regardless of launch directory)
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env.local') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
    process.exit(1);
}
const app = (0, express_1.default)();
// Behind Render/Vercel proxies: use the first X-Forwarded-For hop as req.ip (rate limiting)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
// Apply rate limiting to all requests
app.use(rateLimiter_1.limiter);
const allowedOrigins = [
    'https://seebu.prannsss.dev',
    'http://localhost:3000',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    process.env.FRONTEND_URL
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Body limits: up to 50MB for base64 image uploads (reports/tasks), 1MB elsewhere.
// The upload parser runs first; the global parser then skips already-parsed bodies.
const uploadJson = express_1.default.json({ limit: '50mb' });
app.use('/api/v1/reports', uploadJson);
app.use('/api/v1/tasks', uploadJson);
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
console.log(`[cache] REDIS_URL ${process.env.REDIS_URL ? 'set' : 'unset (in-memory cache)'}`);
// Health check endpoint for Render/Root URL
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'SeeBu API',
        timestamp: new Date().toISOString()
    });
});
// Root route - Render shows this when accessing the base URL
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'SeeBu API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/locations', locationRoutes_1.default);
app.use('/api/v1/reports', reportRoutes_1.default);
app.use('/api/v1/analytics', analyticsRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/tasks', taskRoutes_1.default);
app.use('/api/v1/departments', departmentRoutes_1.default);
// API health check
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});
// JSON error responses (instead of Express's default HTML page)
app.use((err, req, res, _next) => {
    if (err?.type === 'entity.too.large')
        return res.status(413).json({ error: 'Upload too large. Please use fewer or smaller photos.' });
    if (err?.message === 'Not allowed by CORS')
        return res.status(403).json({ error: 'Origin not allowed' });
    const status = err?.status || 500;
    if (status < 500)
        return res.status(status).json({ error: 'Invalid request' });
    console.error('[unhandled]', err);
    return res.status(status).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
