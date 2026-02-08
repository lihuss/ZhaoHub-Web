const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ==========================================
// 存储配置
// ==========================================

// 存储类型： 'local' | 'oss'
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

// OSS 配置占位符（未来填充）
const OSS_CONFIG = {
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET
};

// 本地存储路径配置
// 生产环境：使用项目外的独立目录（不会被部署覆盖）
// 开发环境：使用项目内的 public/uploads
const UPLOADS_DIR = process.env.UPLOADS_DIR || (
    process.env.NODE_ENV === 'production'
        ? '/var/www/zqzx-uploads'  // 服务器上的独立目录
        : path.join(__dirname, '../public/uploads')  // 这里的相对路径需要根据使用位置调整
);

// 确保本地目录存在
if (STORAGE_TYPE === 'local') {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

// ==========================================
// Multer 配置 (用于处理文件上传)
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (STORAGE_TYPE === 'local') {
            cb(null, UPLOADS_DIR);
        } else {
            // 如果是OSS，可能需要先存到临时目录
            cb(null, '/tmp');
        }
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// 统一图片处理工具
// ==========================================

const ImageService = {
    // 获取上传中间件
    getUploader: () => upload,

    // 获取图片访问URL
    getUrl: (filename) => {
        if (!filename) return '';

        // 如果已经是完整的URL（比如之前迁移过一部分数据），直接返回
        if (filename.startsWith('http')) return filename;

        // 本地存储：返回相对路径
        if (STORAGE_TYPE === 'local') {
            return '/uploads/' + filename;
        }

        // OSS存储：返回完整OSS路径
        // return `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.region}.aliyuncs.com/${filename}`;
        return ''; // 占位
    },

    // 处理上传后的文件（在此处进行OSS上传等操作）
    handleUpload: async (files) => {
        if (!files || files.length === 0) return [];

        const results = [];

        if (STORAGE_TYPE === 'local') {
            // 本地存储直接返回文件名即可，不需要额外操作
            // Multer 已经把文件存好了
            for (const file of files) {
                results.push(file.filename);
            }
        } else {
            // TODO: 这里实现上传到 OSS 的逻辑
            // 1. 遍历 files
            // 2. 调用 OSS SDK 上传文件
            // 3. 删除本地临时文件
            // 4. 返回 OSS 文件名或路径
        }

        return results;
    }
};

module.exports = {
    ImageService,
    UPLOADS_DIR
};
