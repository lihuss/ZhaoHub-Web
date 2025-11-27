const mongoose = require('mongoose');

// 连接数据库 (在 server.js 中调用)
const connectDB = async () => {
    try {
        // 这里的 localhost 在云服务器上如果数据库也在本地则不用改
        await mongoose.connect('mongodb://127.0.0.1:27017/zz_memory_2025');
        console.log('MongoDB 连接成功');
    } catch (err) {
        console.error('MongoDB 连接失败:', err);
        process.exit(1);
    }
};

// 班级模型
const ClassSchema = new mongoose.Schema({
    name: { type: String, required: true }, // 如：高三(1)班
    fullName: { type: String, unique: true }, // 如：2025届 高三(1)班
    createdAt: { type: Date, default: Date.now }
});

// 帖子模型
const PostSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    content: { type: String, required: true },
    image: { type: String }, // 图片路径
    likes: { type: Number, default: 0 },
    comments: [{
        content: String,
        time: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    connectDB,
    Class: mongoose.model('Class', ClassSchema),
    Post: mongoose.model('Post', PostSchema)
};