-- 修改图片字段为 TEXT 以支持多图存储 (JSON格式)
ALTER TABLE posts MODIFY COLUMN image TEXT;
ALTER TABLE treehole_messages MODIFY COLUMN image TEXT;
ALTER TABLE consultation_posts MODIFY COLUMN image TEXT;
