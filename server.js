const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const session = require('express-session');
const db = require('./db');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// 配置 Session（Cookie 保持登录30天）
app.use(session({
    secret: 'zqzx2025-memory-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
        httpOnly: true
    }
}));

// 将用户信息注入到所有视图
app.use(async (req, res, next) => {
    res.locals.user = null;
    if (req.session.userId) {
        try {
            const user = await auth.getUserById(req.session.userId);
            res.locals.user = user;
        } catch (err) {
            console.error('获取用户信息失败:', err);
        }
    }
    next();
});

// 登录验证中间件
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// 管理员验证中间件
function requireAdmin(req, res, next) {
    if (!res.locals.user || !res.locals.user.is_admin) {
        return res.status(403).render('admin', { user: res.locals.user, systemCodes: [] });
    }
    next();
}

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

// --- 认证路由 ---

// 登录页
app.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/hall');
    }
    res.render('login', { error: null, success: req.query.registered ? '注册成功，请登录！' : null });
});

// 处理登录
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await auth.authenticateUser(username, password);

        if (!user) {
            return res.render('login', { error: '用户名或密码错误', success: null });
        }

        req.session.userId = user.id;
        res.redirect('/hall');
    } catch (err) {
        console.error('登录失败:', err);
        res.render('login', { error: '登录失败，请稍后重试', success: null });
    }
});

// 注册页
app.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/hall');
    }
    res.render('register', { error: null, inviteCode: req.query.code || '', formData: {} });
});

// 处理注册
app.post('/register', async (req, res) => {
    try {
        const { inviteCode, username, password, confirmPassword, campus, schoolType, graduationYear, className } = req.body;
        const formData = { username, campus, schoolType, graduationYear, className };

        // 验证密码
        if (password !== confirmPassword) {
            return res.render('register', { error: '两次输入的密码不一致', inviteCode, formData });
        }

        if (password.length < 6) {
            return res.render('register', { error: '密码至少需要6个字符', inviteCode, formData });
        }

        // 验证用户名
        if (username.length < 2 || username.length > 20) {
            return res.render('register', { error: '用户名需要2-20个字符', inviteCode, formData });
        }

        if (await auth.usernameExists(username)) {
            return res.render('register', { error: '用户名已被占用', inviteCode, formData });
        }

        // 验证邀请码
        const invite = await auth.validateInviteCode(inviteCode.toUpperCase());
        if (!invite) {
            return res.render('register', { error: '邀请码无效或已被使用', inviteCode, formData });
        }

        // 注册用户
        const userId = await auth.registerUser({
            username,
            password,
            campus,
            schoolType,
            graduationYear,
            className,
            invitedBy: invite.created_by
        });

        // 使用邀请码
        await auth.useInviteCode(inviteCode.toUpperCase(), userId);

        // 为新用户生成3个邀请码
        await auth.generateInviteCodesForUser(userId);

        res.redirect('/login?registered=1');
    } catch (err) {
        console.error('注册失败:', err);
        res.render('register', { error: '注册失败，请稍后重试', inviteCode: req.body.inviteCode, formData: req.body });
    }
});

// 退出登录
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// 我的邀请码
app.get('/my-codes', requireAuth, async (req, res) => {
    try {
        const codes = await auth.getUserInviteCodes(req.session.userId);
        res.render('my-codes', { codes });
    } catch (err) {
        console.error('获取邀请码失败:', err);
        res.redirect('/hall');
    }
});

// --- 管理员路由 ---

// 管理面板
app.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const systemCodes = await auth.getSystemInviteCodes();
        res.render('admin', { user: res.locals.user, systemCodes, newCodes: null });
    } catch (err) {
        console.error('获取系统邀请码失败:', err);
        res.render('admin', { user: res.locals.user, systemCodes: [], newCodes: null });
    }
});

// 生成系统邀请码
app.post('/admin/generate-code', requireAuth, requireAdmin, async (req, res) => {
    try {
        const count = parseInt(req.body.count) || 1;
        const newCodes = [];

        for (let i = 0; i < Math.min(count, 10); i++) {
            const code = await auth.adminGenerateInviteCode();
            newCodes.push(code);
        }

        const systemCodes = await auth.getSystemInviteCodes();
        res.render('admin', { user: res.locals.user, systemCodes, newCodes });
    } catch (err) {
        console.error('生成邀请码失败:', err);
        res.redirect('/admin');
    }
});

// --- 原有路由 ---

// 1. 封面页
app.get('/', (req, res) => {
    res.render('index');
});

// 2. 班级大厅（需要登录）
app.get('/hall', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM classes ORDER BY created_at DESC');
        res.render('hall', { classes: rows });
    } catch (err) {
        console.error(err);
        res.status(500).send("数据库连接失败，请检查db.js密码配置");
    }
});

// 开通班级
app.post('/create-class', requireAuth, async (req, res) => {
    const className = req.body.className.trim();
    if (!className) return res.redirect('/hall');

    const fullName = `2025届 ${className}`;

    try {
        const [existing] = await db.query('SELECT * FROM classes WHERE full_name = ?', [fullName]);

        if (existing.length === 0) {
            await db.query('INSERT INTO classes (name, full_name) VALUES (?, ?)', [className, fullName]);
        }
        res.redirect('/hall');
    } catch (err) {
        console.log(err);
        res.redirect('/hall');
    }
});

// 3. 班级详情页
app.get('/class/:id', requireAuth, async (req, res) => {
    try {
        const classId = req.params.id;

        const [classRows] = await db.query('SELECT * FROM classes WHERE id = ?', [classId]);
        if (classRows.length === 0) return res.redirect('/hall');
        const currentClass = classRows[0];

        // 获取帖子及发布者信息
        const [posts] = await db.query(`
            SELECT p.*, u.username as author_name 
            FROM posts p 
            LEFT JOIN users u ON p.user_id = u.id 
            WHERE p.class_id = ? 
            ORDER BY p.created_at DESC
        `, [classId]);

        // 获取评论及发布者信息
        for (let post of posts) {
            const [comments] = await db.query(`
                SELECT c.*, u.username as author_name 
                FROM comments c 
                LEFT JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = ? 
                ORDER BY c.created_at ASC
            `, [post.id]);
            post.comments = comments;
        }

        res.render('class', { currentClass, posts, moment });
    } catch (err) {
        console.log(err);
        res.redirect('/hall');
    }
});

// 发布帖子（关联用户）
app.post('/class/:id/post', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const classId = req.params.id;
        const content = req.body.content;
        const userId = req.session.userId;
        let image = '';
        if (req.file) {
            image = '/uploads/' + req.file.filename;
        }

        await db.query('INSERT INTO posts (class_id, user_id, content, image) VALUES (?, ?, ?, ?)', [classId, userId, content, image]);
        res.redirect(`/class/${classId}`);
    } catch (err) {
        console.log(err);
        res.send("发布失败");
    }
});

// 点赞
app.post('/post/:id/like', requireAuth, async (req, res) => {
    try {
        await db.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);

        const [rows] = await db.query('SELECT class_id FROM posts WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.redirect(`/class/${rows[0].class_id}`);
        } else {
            res.redirect('/hall');
        }
    } catch (err) {
        res.send("操作失败");
    }
});

// 评论（关联用户）
app.post('/post/:id/comment', requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const content = req.body.commentContent;
        const userId = req.session.userId;

        await db.query('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, userId, content]);

        const [rows] = await db.query('SELECT class_id FROM posts WHERE id = ?', [postId]);
        res.redirect(`/class/${rows[0].class_id}`);
    } catch (err) {
        console.log(err);
        res.send("操作失败");
    }
});

// 举报
app.post('/post/:id/report', requireAuth, (req, res) => {
    console.log(`帖子 ${req.params.id} 被举报，举报者: ${req.session.userId}`);
    res.send("<script>alert('举报成功，管理员会尽快处理。'); history.back();</script>");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});