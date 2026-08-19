-- database.sql
-- Database structure for server-side implementations (SQLite / MySQL)

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    image_url LONGTEXT NOT NULL
);

-- Default Admin Password Setting (Default: 'admin')
INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_pass', 'admin');

-- Initial Treatments Data
INSERT OR IGNORE INTO services (id, title, price, description, image_url) VALUES 
(1, 'Deep Tissue Massage', 450.00, 'Targeting deep muscle layers to alleviate stress and physical tension.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80'),
(2, 'Hydrating Facial', 380.00, 'Restores moisture balance and leaves your skin glowing with vitality.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80');