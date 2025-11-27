const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const moment = require('moment'); 
const db = require('./db'); // 引入刚才写的数据库连接

const app = express();
const PORT = process.env.PORT || 3000; // 这里的env.PORT写错了修正为env

// 配置中间件
app.set('view engine', 'ejs');
app.use(express.static('public')); 
app.use(bodyParser.urlencoded({ extended: true }));

// 配置图片上传
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
        // SQL: 查询所有班级，按时间倒序
        const [rows] = await db.query('SELECT * FROM classes ORDER BY created_at DESC');
        res.render('hall', { classes: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("数据库连接失败，请检查db.js密码配置");
    }
});

// 开通班级
app.post('/create-class', async (req, res) => {
    const className = req.body.className.trim();
    if (!className) return res.redirect('/hall');
    
    const fullName = `2025届 ${className}`;
    
    try {
        // SQL: 检查是否已存在
        const [existing] = await db.query('SELECT * FROM classes WHERE full_name = ?', [fullName]);
        
        if (existing.length === 0) {
            // SQL: 插入新班级
            await db.query('INSERT INTO classes (name, full_name) VALUES (?, ?)', [className, fullName]);
        }
        res.redirect('/hall');
    } catch (err) {
        console.log(err);
        res.redirect('/hall');
    }
});

// 3. 班级详情页 (这是逻辑最复杂的部分)
app.get('/class/:id', async (req, res) => {
    try {
        const classId = req.params.id;

        // 1. 获取班级信息
        const [classRows] = await db.query('SELECT * FROM classes WHERE id = ?', [classId]);
        if (classRows.length === 0) return res.redirect('/hall');
        const currentClass = classRows[0];

        // 2. 获取该班级的所有帖子
        const [posts] = await db.query('SELECT * FROM posts WHERE class_id = ? ORDER BY created_at DESC', [classId]);

        // 3. (关键) 因为MySQL评论在另一张表，我们需要手动把评论“塞”进对应的帖子里
        // 这种写法虽然不是性能最高，但最容易理解
        for (let post of posts) {
            const [comments] = await db.query('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC', [post.id]);
            post.comments = comments; // 把查到的评论数组挂载到 post 对象上
        }

        res.render('class', { currentClass, posts, moment });
    } catch (err) {
        console.log(err);
        res.redirect('/hall');
    }
});

// 发布帖子
app.post('/class/:id/post', upload.single('image'), async (req, res) => {
    try {
        const classId = req.params.id;
        const content = req.body.content;
        let image = '';
        if (req.file) {
            image = '/uploads/' + req.file.filename;
        }

        await db.query('INSERT INTO posts (class_id, content, image) VALUES (?, ?, ?)', [classId, content, image]);
        res.redirect(`/class/${classId}`);
    } catch (err) {
        console.log(err);
        res.send("发布失败");
    }
});

// 点赞
app.post('/post/:id/like', async (req, res) => {
    try {
        // SQL: 更新点赞数
        await db.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
        
        // 查一下这个帖子属于哪个班，方便跳转回去
        const [rows] = await db.query('SELECT class_id FROM posts WHERE id = ?', [req.params.id]);
        if(rows.length > 0) {
            res.redirect(`/class/${rows[0].class_id}`);
        } else {
            res.redirect('/hall');
        }
    } catch (err) {
        res.send("操作失败");
    }
});

// 评论
app.post('/post/:id/comment', async (req, res) => {
    try {
        const postId = req.params.id;
        const content = req.body.commentContent;

        await db.query('INSERT INTO comments (post_id, content) VALUES (?, ?)', [postId, content]);

        // 跳转回去
        const [rows] = await db.query('SELECT class_id FROM posts WHERE id = ?', [postId]);
        res.redirect(`/class/${rows[0].class_id}`);
    } catch (err) {
        console.log(err);
        res.send("操作失败");
    }
});

// 举报
app.post('/post/:id/report', (req, res) => {
    console.log(`帖子 ${req.params.id} 被举报`);
    res.send("<script>alert('举报成功，管理员会尽快处理。'); history.back();</script>");
});

app.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});