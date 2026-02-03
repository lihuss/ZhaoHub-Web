-- Upgrade Tree Hole to support Like/Dislike and new features

-- Add dislikes count to messages
ALTER TABLE treehole_messages ADD COLUMN dislikes INT DEFAULT 0;

-- Add type to likes table to distinguish between like and dislike
ALTER TABLE treehole_likes ADD COLUMN type ENUM('like', 'dislike') NOT NULL DEFAULT 'like';

-- Ensure unique constraint is still valid (user can only have one reaction per message)
-- The existing unique key (message_id, user_id) is sufficient for mutual exclusion.
