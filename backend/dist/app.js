"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
// Load variables
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.local') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), 'backend/.env') });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
    'https://seebucommunity.vercel.app',
    'http://localhost:3000',
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
