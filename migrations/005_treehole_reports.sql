CREATE TABLE IF NOT EXISTS treehole_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    reporter_id INT,
    reason VARCHAR(255),
    status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (message_id) REFERENCES treehole_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
);
