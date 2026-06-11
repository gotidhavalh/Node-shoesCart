-- Shoes Cart Database Schema
CREATE DATABASE IF NOT EXISTS shoes_cart;
USE shoes_cart;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (Shoes) Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  category_id INT,
  brand VARCHAR(100),
  image_url VARCHAR(500),
  sizes JSON,
  colors JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  size VARCHAR(20),
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id, size, color)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  size VARCHAR(20),
  color VARCHAR(50),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Seed: Default Categories
INSERT IGNORE INTO categories (name, description) VALUES
  ('Running', 'Shoes designed for running and jogging'),
  ('Casual', 'Everyday casual footwear'),
  ('Sports', 'Athletic and sport shoes'),
  ('Formal', 'Formal and dress shoes'),
  ('Sandals', 'Open-toe footwear');

-- Seed: Sample Products
INSERT IGNORE INTO products (name, description, price, stock, category_id, brand, sizes, colors) VALUES
  ('Air Max Pro', 'Premium running shoes with air cushioning', 129.99, 50, 1, 'Nike', '["6","7","8","9","10","11"]', '["Black","White","Red"]'),
  ('Ultra Boost', 'High performance boost running shoe', 149.99, 30, 1, 'Adidas', '["7","8","9","10","11"]', '["White","Grey","Blue"]'),
  ('Chuck Taylor Classic', 'Iconic canvas casual sneakers', 59.99, 100, 2, 'Converse', '["5","6","7","8","9","10","11","12"]', '["Black","White","Navy"]'),
  ('Vans Old Skool', 'Classic skate shoe with side stripe', 69.99, 80, 2, 'Vans', '["6","7","8","9","10","11"]', '["Black/White","Navy","Red"]'),
  ('Jordan 1 Retro', 'Classic basketball shoe turned streetwear icon', 179.99, 20, 3, 'Nike', '["8","9","10","11","12"]', '["Chicago","Bred","Royal"]');
