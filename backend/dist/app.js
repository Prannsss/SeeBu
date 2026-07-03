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
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
// Apply rate limiting to all requests
app.use(rateLimiter_1.limiter);
const allowedOrigins = [
    'https://seebucommunity.vercel.app',
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
// Small default body limit; reports/tasks accept base64 photo payloads and get a
// larger, route-scoped limit applied ahead of their routers below.
app.use(express_1.default.json({ limit: '100kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100kb' }));
const imageUploadBodyLimit = express_1.default.json({ limit: '10mb' });
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
app.use('/api/v1/reports', imageUploadBodyLimit, reportRoutes_1.default);
app.use('/api/v1/analytics', analyticsRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/tasks', imageUploadBodyLimit, taskRoutes_1.default);
app.use('/api/v1/departments', departmentRoutes_1.default);
// API health check
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
