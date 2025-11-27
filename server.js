const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const moment = require('moment'); // 处理时间格式
const { connectDB, Class, Post } = require('./models');

const app = express();
const PORT = process.exit.PORT || 3000;

// 连接数据库
connectDB();

// 配置中间件
app.set('view engine', 'ejs');
app.use(express.static('public')); // 静态文件服务
app.use(bodyParser.urlencoded({ extended: true }));

// 配置图片上传 (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 路由区域 ---

// 1. 封面页
app.get('/', (req, res) => {
    res.render('index');
});

// 2. 班级大厅
app.get('/hall', async (req, res) => {
    try {
        const classes = await Class.find().sort({ createdAt: -1 });
        res.render('hall', { classes });
    } catch (err) {
        res.status(500).send("服务器错误");
    }
});

// 开通班级
app.post('/create-class', async (req, res) => {
    const className = req.body.className.trim();
    if (!className) return res.redirect('/hall');
    
    const fullName = `2025届 ${className}`;
    
    try {
        // 检查是否已存在
        let existing = await Class.findOne({ fullName });
        if (!existing) {
            await Class.create({ name: className, fullName });
        }
        res.redirect('/hall');
    } catch (err) {
        console.log(err);
        res.redirect('/hall');
    }
});

// 3. 班级详情页 (帖子列表)
app.get('/class/:id', async (req, res) => {
    try {
        const currentClass = await Class.findById(req.params.id);
        const posts = await Post.find({ classId: req.params.id }).sort({ createdAt: -1 });
        res.render('class', { currentClass, posts, moment });
    } catch (err) {
        res.redirect('/hall');
    }
});

// 发布帖子
app.post('/class/:id/post', upload.single('image'), async (req, res) => {
    try {
        const newPost = {
            classId: req.params.id,
            content: req.body.content
        };
        if (req.file) {
            newPost.image = '/uploads/' + req.file.filename;
        }
        await Post.create(newPost);
        res.redirect(`/class/${req.params.id}`);
    } catch (err) {
        res.send("发布失败");
    }
});

// 点赞
app.post('/post/:id/like', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
        // 获取该帖子所在的班级ID以返回
        const post = await Post.findById(req.params.id);
        res.redirect(`/class/${post.classId}`);
    } catch (err) {
        res.send("操作失败");
    }
});

// 评论
app.post('/post/:id/comment', async (req, res) => {
    try {
        const comment = { content: req.body.commentContent };
        await Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment } });
        const post = await Post.findById(req.params.id);
        res.redirect(`/class/${post.classId}`);
    } catch (err) {
        res.send("操作失败");
    }
});

// 举报 (简单实现，仅打印日志，后期可入库)
app.post('/post/:id/report', (req, res) => {
    console.log(`帖子 ${req.params.id} 被举报`);
    res.send("<script>alert('举报成功，管理员会尽快处理。'); history.back();</script>");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});