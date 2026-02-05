-- 咨询专区帖子表
CREATE TABLE IF NOT EXISTS consultation_posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,              -- 真实用户ID
    content TEXT NOT NULL,             -- 内容
    image VARCHAR(255),                -- 图片
    is_anonymous TINYINT(1) DEFAULT 0, -- 是否匿名 (0=否, 1=是)
    likes INT DEFAULT 0,               -- 点赞数
    reply_count INT DEFAULT 0,         -- 回复数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 咨询专区评论表
CREATE TABLE IF NOT EXISTS consultation_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    is_anonymous TINYINT(1) DEFAULT 0, -- 评论也可以选择匿名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES consultation_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 咨询专区点赞表
CREATE TABLE IF NOT EXISTS consultation_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_consultation_like (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES consultation_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
