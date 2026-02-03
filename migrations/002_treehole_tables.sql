-- =====================================================
-- 树洞（Tree Hole）功能数据库迁移脚本
-- 针对: zz_memory_2025 数据库
-- =====================================================

-- 树洞帖子表（洞）
CREATE TABLE IF NOT EXISTS treehole_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,              -- 发帖用户（前端隐藏不显示）
    content TEXT NOT NULL,             -- 帖子内容
    image VARCHAR(255),                -- 可选配图
    likes INT DEFAULT 0,               -- 点赞数
    reply_count INT DEFAULT 0,         -- 回复数（冗余字段，提升查询性能）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 树洞回复表
CREATE TABLE IF NOT EXISTS treehole_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,              -- 所属帖子
    user_id INT NOT NULL,              -- 回复用户（前端隐藏不显示）
    content TEXT NOT NULL,             -- 回复内容
    image VARCHAR(255),                -- 可选配图
    quote_reply_id INT,                -- 引用的回复ID（可选）
    floor_number INT NOT NULL,         -- 楼层号
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES treehole_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quote_reply_id) REFERENCES treehole_replies(id) ON DELETE SET NULL
);

-- 树洞点赞记录表
CREATE TABLE IF NOT EXISTS treehole_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES treehole_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX idx_treehole_posts_created ON treehole_posts(created_at DESC);
CREATE INDEX idx_treehole_replies_post ON treehole_replies(post_id, floor_number);
