-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: 30 أبريل 2026 الساعة 23:58
-- إصدار الخادم: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `graduation_project`
--

-- --------------------------------------------------------

--
-- بنية الجدول `addons`
--

CREATE TABLE `addons` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `inventory_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `addons`
--

INSERT INTO `addons` (`id`, `name`, `price`, `inventory_id`) VALUES
(1, 'Extra Espresso Shot', 0.80, 1),
(2, 'Oat Milk', 0.50, 14),
(3, 'Almond Milk', 0.50, 15),
(4, 'Soy Milk', 0.50, 16),
(5, 'Coconut Milk', 0.60, 17),
(6, 'Whipped Cream', 0.40, 18),
(7, 'Caramel Syrup', 0.40, 7),
(8, 'Vanilla Syrup', 0.40, 19),
(9, 'Hazelnut Syrup', 0.40, 20),
(10, 'Honey', 0.30, 21),
(11, 'Jalapeño Slices', 0.50, 23),
(12, 'Beef Bacon Bits', 1.00, 24),
(13, 'Cheddar Cheese Sauce', 0.75, 31),
(14, 'Spicy Mayo (Dynamite)', 0.60, 33),
(15, 'Garlic Dip', 0.50, 30),
(16, 'BBQ Sauce', 0.50, 29),
(17, 'Ranch Dressing', 0.50, 32),
(18, 'Crispy Onion Flakes', 0.40, 34);

-- --------------------------------------------------------

--
-- بنية الجدول `ai_insights_cache`
--

CREATE TABLE `ai_insights_cache` (
  `id` int(11) NOT NULL,
  `insight_type` varchar(100) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `ai_insights_cache`
--

INSERT INTO `ai_insights_cache` (`id`, `insight_type`, `payload`, `expires_at`) VALUES
(1, 'sales_forecast', '{\"prediction\": \"Flat White sales are projected to grow by 25% due to upcoming university events.\", \"confidence\": \"high\"}', '2026-12-31 00:00:00'),
(2, 'inventory_alert', '{\"prediction\": \"Coffee Beans stock is low. Based on current trends, it will run out in 2 days.\", \"confidence\": \"very_high\"}', '2026-12-31 00:00:00');

-- --------------------------------------------------------

--
-- بنية الجدول `careers`
--

CREATE TABLE `careers` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) DEFAULT 'Full-time',
  `location` varchar(255) DEFAULT 'Birmingham',
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `careers`
--

INSERT INTO `careers` (`id`, `title`, `type`, `location`, `description`, `active`, `created_at`) VALUES
(3, 'Barista', 'Full-time / Part-time', 'Birmingham', 'Seeking an experienced barista to lead our coffee excellence.', 1, '2026-04-30 19:34:37'),
(4, 'Kitchen Assistant', 'Full-time', 'Birmingham', 'Support our kitchen operations and ensure food quality.', 1, '2026-04-30 19:34:37'),
(5, 'Front of House', 'Part-time', 'Birmingham', 'Welcome guests and provide exceptional service.', 1, '2026-04-30 19:34:37');

-- --------------------------------------------------------

--
-- بنية الجدول `categories`
--

CREATE TABLE `categories` (
  `id` varchar(50) NOT NULL,
  `label` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `categories`
--

INSERT INTO `categories` (`id`, `label`, `icon`, `sort_order`) VALUES
('cold', 'Cold Drinks', 'fa-ice-cream', 5),
('espresso', 'Coffee & Espresso', 'fa-mug-hot', 1),
('food', 'Food & Pastries', 'fa-bread-slice', 3),
('sides', 'Snacks & Sides', 'fa-utensils', 4),
('soft', 'Soft Drinks & Other', 'fa-bottle-water', 7),
('sweets', 'Sweets & Cakes', 'fa-cake-candles', 6),
('tea', 'Tea & Other Drinks', 'fa-leaf', 2);

-- --------------------------------------------------------

--
-- بنية الجدول `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `user_msg` text DEFAULT NULL,
  `ai_msg` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(50) DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `message`, `status`, `created_at`, `is_read`) VALUES
(1, 'joy william', 'joywilliam@gmail.com', 'What food products are suitable for vegetarians?', 'new', '2026-04-30 19:21:02', 0),
(2, 'Alex', 'Alex@google.com', 'I want products that do not contain nuts because they cause me an allergic reaction.', 'new', '2026-04-30 21:21:36', 0),
(3, 'Oliver Bennett', 'oliver.b@gmail.com', 'Hi Sophie! I loved the Flat White today. Do you sell your coffee beans in bags? I would love to brew some at home.', 'new', '2026-04-23 14:37:35', 0),
(4, 'Sophie Harrison', 'sophie.h@outlook.com', 'Hello, I left my umbrella near the window seats this afternoon. Did anyone find it? It is a small blue one.', 'new', '2026-04-23 14:37:35', 0),
(5, 'George Miller', 'george.m@university.ac.uk', 'I am a student at the university. Do you offer any group discounts for study sessions? We are about 6 people.', 'new', '2026-04-23 14:37:35', 0),
(6, 'Charlotte Davies', 'charlotte.d@icloud.com', 'The Vegan Pastry was amazing! Could you please let me know the ingredients? I have a specific nut allergy.', 'new', '2026-04-23 14:37:35', 0),
(7, 'Arthur Wright', 'arthur.w@fastmail.com', 'I am interested in the Barista position mentioned by Sophie. Should I bring my CV in person or is email enough?', 'new', '2026-04-23 14:37:35', 0);

-- --------------------------------------------------------

--
-- بنية الجدول `general_feedback`
--

CREATE TABLE `general_feedback` (
  `id` int(11) NOT NULL,
  `reviewer_name` varchar(255) DEFAULT 'Anonymous',
  `comment` text DEFAULT NULL,
  `rating` tinyint(1) DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `general_feedback`
--

INSERT INTO `general_feedback` (`id`, `reviewer_name`, `comment`, `rating`, `created_at`) VALUES
(1, 'Jennifer', 'This is my favorite cafe because it offers delicious and high-quality hot and cold food and drinks at very affordable prices.', 5, '2026-04-30 20:36:50'),
(2, 'lio', 'This is my favorite cafe because it offers delicious and high-quality hot and cold food and drinks at very affordable prices', 5, '2026-04-30 20:47:34');

-- --------------------------------------------------------

--
-- بنية الجدول `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `min_threshold` int(11) DEFAULT 10,
  `unit` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `inventory`
--

INSERT INTO `inventory` (`id`, `item_name`, `quantity`, `min_threshold`, `unit`) VALUES
(1, 'Coffee Beans', 14.76, 5, 'KG'),
(2, 'Fresh Milk', 10.30, 10, 'Liters'),
(3, 'Pastry Bags', 99.00, 20, 'Units'),
(4, 'Sugar Sticks', 500.00, 100, 'Pieces'),
(5, 'Paper Cups 12oz', 200.00, 50, 'Pieces'),
(6, 'Chocolate Powder', 5.00, 2, 'KG'),
(7, 'Caramel Syrup', 8.00, 3, 'Bottles'),
(8, 'Cleaning Supplies', 15.00, 5, 'Liters'),
(9, 'Tea Leaves', 9.99, 2, 'KG'),
(10, 'Bread/Buns', 99.00, 20, 'Pieces'),
(11, 'Butter', 19.95, 5, 'KG'),
(12, 'Cheese/Fillings', 29.90, 5, 'KG'),
(13, 'Cake Slices', 48.00, 10, 'Pieces'),
(14, 'Oat Milk', 20.00, 5, 'Liters'),
(15, 'Almond Milk', 15.00, 5, 'Liters'),
(16, 'Soy Milk', 12.00, 5, 'Liters'),
(17, 'Coconut Milk', 10.00, 5, 'Liters'),
(18, 'Whipped Cream', 5.00, 2, 'KG'),
(19, 'Vanilla Syrup', 10.00, 2, 'Bottles'),
(20, 'Hazelnut Syrup', 8.00, 2, 'Bottles'),
(21, 'Honey', 5.00, 1, 'KG'),
(22, 'Avocado', 10.00, 5, 'Pieces'),
(23, 'Jalapeños', 5.00, 1, 'KG'),
(24, 'Bacon Bits', 3.00, 1, 'KG'),
(25, 'Onion Rings', 100.00, 20, 'Pieces'),
(26, 'Fries', 50.00, 10, 'KG'),
(27, 'Chicken Strips', 200.00, 50, 'Pieces'),
(28, 'Mozzarella Sticks', 150.00, 30, 'Pieces'),
(29, 'BBQ Sauce', 10.00, 2, 'Bottles'),
(30, 'Garlic Dip', 10.00, 2, 'Bottles'),
(31, 'Cheddar Sauce', 5.00, 1, 'KG'),
(32, 'Ranch Dressing', 8.00, 2, 'Bottles'),
(33, 'Spicy Mayo', 7.00, 2, 'Bottles'),
(34, 'Onion Flakes', 2.00, 1, 'KG');

-- --------------------------------------------------------

--
-- بنية الجدول `job_applications`
--

CREATE TABLE `job_applications` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `cv_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `cover_letter` text DEFAULT NULL,
  `resume_url` varchar(1024) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `job_applications`
--

INSERT INTO `job_applications` (`id`, `name`, `email`, `phone`, `position`, `cv_text`, `created_at`, `cover_letter`, `resume_url`) VALUES
(1, 'joy william', 'joywilliam@xn--ogbw0cgj.xn--jgbko', '0795654562', 'Barista', NULL, '2026-04-30 19:37:24', 'Nearly 20 years of experience in barista and cafe industry', NULL);

-- --------------------------------------------------------

--
-- بنية الجدول `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `category_id` varchar(50) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `price_num` decimal(10,2) DEFAULT NULL,
  `price_display` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `available` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `addons` text DEFAULT NULL,
  `image_url` varchar(1024) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `menu_items`
--

INSERT INTO `menu_items` (`id`, `category_id`, `name`, `price_num`, `price_display`, `description`, `tags`, `available`, `sort_order`, `addons`, `image_url`) VALUES
(1, 'espresso', 'Espresso', 2.80, '£2.80', 'A pure, bold single origin shot with a clean and bright finish. The ultimate classic coffee experience.', 'Vegan,Classic,Hot', 1, 1, 'Extra Shot,Caramel Syrup,Vanilla Syrup', 'Espresso.jpg'),
(2, 'espresso', 'Flat White', 3.60, '£3.60', 'Silky microfoam with our house espresso blend', 'vegetarian', 1, 2, NULL, NULL),
(3, 'espresso', 'Cappuccino', 3.40, '£3.40', 'Equal parts espresso, steamed milk and foam', 'vegetarian', 1, 4, NULL, NULL),
(4, 'espresso', 'Latte', 3.80, '£3.80', 'Smooth and mellow — our most popular order', 'vegetarian', 1, 5, NULL, NULL),
(5, 'espresso', 'Long Black', 3.00, '£3.00', 'Double espresso over hot water', 'vegan', 1, 6, NULL, NULL),
(6, 'espresso', 'Pour-Over Filter', 4.50, '£4.50', 'V60 and seasonal methods', 'vegan', 1, 7, NULL, NULL),
(7, 'espresso', 'British Hot Chocolate', 4.00, '£4.00', 'Rich cocoa with steamed milk', 'vegan', 1, 10, NULL, NULL),
(8, 'food', 'Freshly Baked Pastry', 3.50, '£3.50', 'Croissants and daily specials', 'vegetarian', 1, 11, NULL, NULL),
(9, 'sweets', 'Cake of the Day', 4.50, '£4.50', 'Seasonal bakes', 'vegetarian', 1, 12, NULL, NULL),
(10, 'food', 'Sandwich', 6.00, '£6.00', 'Artisan bread with seasonal fillings', 'vegetarian', 1, 13, NULL, NULL),
(11, 'food', 'Brunch Plate', 8.50, '£8.50', 'Selected days only', 'vegetarian', 1, 14, NULL, NULL),
(12, 'food', 'Vegan Pastry', 3.50, '£3.50', '100% plant-based daily bake', 'vegan', 1, 15, NULL, 'Vegan Pastry.jpg'),
(13, 'tea', 'Mug of Peppermint Tea', 3.50, '£3.50', 'Fresh peppermint in hot water', 'vegan', 1, 16, NULL, NULL),
(14, 'sweets', 'Raspberry & Custard laminated pastry.', 3.45, '£3.45', 'Crispy, buttery laminated dough filled with smooth vanilla custard and topped with fresh raspberries and a light glaze', 'Artisan,Fruit-Based,Freshly Baked,Vegetarian', 1, 3, 'Side of Fresh Raspberries,Extra Vanilla Custard Dip,Honey Drizzle', NULL),
(15, 'tea', 'Mug of English Breakfast Tea', 3.00, '£3.00', 'A strong, full-bodied black tea, perfect with milk or a slice of lemon', 'Vegetarian,Classic,Hot', 1, 17, 'Mint Leaves,Extra Sugar,Lemon Slice,Honey,Extra Milk (Dairy/Oat/Almond)', 'Mug of English Breakfast Tea.jpg'),
(16, 'tea', 'Pot of Peppermint Tea', 5.00, '£5.00', 'A refreshing and naturally caffeine-free herbal tea with a cool, minty finish', 'Vegan,Caffeine-Free,Herbal,Hot', 1, 18, 'Fresh Mint Leaves,Extra Sugar,Lemon Slice,Honey', 'Pot of Peppermint Tea.png'),
(17, 'tea', 'Pot of Breakfast Tea', 4.85, '£4.85', 'A full pot of traditional English Breakfast tea, served hot and perfect for sharing or multiple pours', 'Hot,Pot,Classic,Sharing', 1, 19, 'Lemon Slice,Extra Milk (Dairy/Oat/Almond),Fresh Mint Leaves,Honey', 'Pot of Breakfast Tea.jpg'),
(18, 'espresso', 'Con Panna', 3.50, '£3.50', 'A rich, bold shot of espresso crowned with a smooth layer of velvety whipped cream for a luxurious, indulgent finish.', 'Vegetarian,Classic,Hot', 1, 20, 'Extra Whipped Cream,Cocoa Dust,Cinnamon Sprinkle', 'Con Panna.jpg');

-- --------------------------------------------------------

--
-- بنية الجدول `menu_item_addons`
--

CREATE TABLE `menu_item_addons` (
  `menu_item_id` int(11) NOT NULL,
  `addon_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `menu_item_addons`
--

INSERT INTO `menu_item_addons` (`menu_item_id`, `addon_id`) VALUES
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 7),
(2, 8),
(3, 1),
(3, 2),
(3, 3),
(3, 4),
(3, 5),
(3, 6),
(3, 7),
(3, 8),
(4, 1),
(4, 2),
(4, 3),
(4, 4),
(4, 5),
(4, 6),
(4, 7),
(4, 8),
(12, 11),
(12, 13),
(12, 14),
(12, 15),
(12, 16),
(12, 17),
(12, 18),
(13, 11),
(13, 12),
(13, 13),
(13, 14),
(13, 15),
(13, 16),
(13, 17);

-- --------------------------------------------------------

--
-- بنية الجدول `offers`
--

CREATE TABLE `offers` (
  `id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `discount_percent` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `offers`
--

INSERT INTO `offers` (`id`, `product_name`, `discount_percent`, `reason`, `end_date`, `active`) VALUES
(1, 'Cappuccino', 15, 'Student Morning Special (8 AM - 11 AM)', '2026-06-28', 1),
(2, 'Freshly Baked Pastry', 50, 'End of Day Clearance Sale', '2026-05-15', 1),
(3, 'Espresso Bundle', 10, 'Corporate Group Order Discount', '2026-12-31', 1),
(4, 'Seasonal Tea', 25, 'Summer Refreshment Promo', '2026-08-01', 1);

-- --------------------------------------------------------

--
-- بنية الجدول `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `store_rating` int(11) DEFAULT 0,
  `store_comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `orders`
--

INSERT INTO `orders` (`id`, `customer_name`, `email`, `total_amount`, `status`, `created_at`, `store_rating`, `store_comment`) VALUES
(1, 'Oliver Bennett', 'oliver.b@gmail.com', 6.40, 'ready', '2026-04-23 14:31:55', 0, NULL),
(2, 'Sophie Harrison', 'sophie.h@outlook.com', 7.30, 'ready', '2026-04-23 14:31:55', 0, NULL),
(3, 'George Miller', 'george.m@university.ac.uk', 9.00, 'ready', '2026-04-23 14:31:55', 0, NULL),
(4, 'Charlotte Davies', 'charlotte.d@icloud.com', 7.90, 'ready', '2026-04-23 14:31:55', 0, NULL),
(5, 'Alex', 'Alex@google.com', 3.60, 'ready', '2026-04-24 21:32:48', 0, NULL),
(6, 'Alex', 'Alex@google.com', 6.20, 'ready', '2026-04-24 22:07:27', 0, NULL),
(7, 'Jennifer', 'Jennifer@google.com', 8.00, 'ready', '2026-04-24 22:13:54', 0, NULL),
(8, 'Jennifer', 'Jennifer@google.com', 7.00, 'ready', '2026-04-25 12:09:44', 0, NULL),
(9, 'Jak', 'Jak@coffee.com', 13.30, 'ready', '2026-04-25 14:49:40', 0, NULL),
(10, 'Loka', 'Loka@coffee.com', 23.50, 'ready', '2026-04-25 14:56:08', 0, NULL),
(11, 'John', 'John@google.com', 10.00, 'ready', '2026-04-25 15:11:38', 0, NULL),
(12, 'Antouny', 'Antouny@google.com', 6.50, 'ready', '2026-04-25 15:24:36', 0, NULL),
(13, 'Jaky', 'Jaky@google.com', 13.00, 'completed', '2026-04-25 16:15:55', 0, NULL),
(14, 'Test User', 'test@example.com', 5.60, 'completed', '2026-04-25 16:32:04', 0, NULL),
(15, 'Leo', 'leo@google.com', 7.00, 'completed', '2026-04-25 16:34:46', 0, NULL),
(16, 'Ayle', 'Ayle@google.com', 14.30, 'completed', '2026-04-25 17:27:10', 0, NULL),
(17, 'jack', 'jack@gmail.com', 11.25, 'ready', '2026-04-30 20:20:17', 0, NULL),
(18, 'Jennifer', 'Jennifer@google.com', 11.30, 'ready', '2026-04-30 20:36:50', 0, NULL),
(19, 'lio', 'lio@gmail.com', 4.84, 'ready', '2026-04-30 20:47:33', 0, NULL);

-- --------------------------------------------------------

--
-- بنية الجدول `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `addons` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `rating` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `item_name`, `quantity`, `price`, `addons`, `notes`, `rating`) VALUES
(1, 1, 2, 'Flat White', 1, 3.60, NULL, NULL, 0),
(2, 1, 1, 'Espresso', 1, 2.80, NULL, NULL, 0),
(3, 2, 4, 'Latte', 1, 3.80, NULL, NULL, 0),
(4, 2, 10, 'Freshly Baked Pastry', 1, 3.50, NULL, NULL, 0),
(5, 17, 2, 'Flat White', 2, 3.60, NULL, NULL, 0),
(6, 17, 22, 'Raspberry & Custard laminated pastry.', 1, 4.05, NULL, NULL, 0),
(7, 18, 2, 'Flat White', 1, 4.20, NULL, NULL, 0),
(8, 18, 5, 'Long Black', 1, 3.00, NULL, NULL, 0),
(9, 18, 10, 'Freshly Baked Pastry', 1, 4.10, NULL, NULL, 0),
(10, 19, 3, 'Cappuccino', 1, 5.70, NULL, NULL, 0),
(11, 7, 9, 'Hot Chocolate', 2, 4.00, NULL, NULL, 0),
(12, 8, 3, 'Cappuccino', 1, 3.40, NULL, NULL, 0),
(13, 8, 2, 'Flat White', 1, 3.60, NULL, NULL, 0),
(14, 9, 10, 'Freshly Baked Pastry', 1, 3.50, NULL, NULL, 0),
(15, 9, 12, 'Sandwich', 1, 6.00, NULL, NULL, 0),
(16, 9, 4, 'Latte', 1, 3.80, NULL, NULL, 0),
(17, 10, 12, 'Sandwich', 2, 6.00, NULL, NULL, 0),
(18, 10, 10, 'Freshly Baked Pastry', 2, 3.50, NULL, NULL, 0),
(19, 10, 11, 'Cake of the Day', 1, 4.50, NULL, NULL, 0),
(20, 11, 2, 'Flat White', 1, 3.60, NULL, NULL, 0),
(21, 11, 3, 'Cappuccino', 1, 3.40, NULL, NULL, 0),
(22, 11, 5, 'Long Black', 1, 3.00, NULL, NULL, 0),
(23, 12, 7, 'Mug of English Breakfast Tea', 1, 3.00, NULL, NULL, 0),
(24, 12, 8, 'Mug of Peppermint Tea', 1, 3.50, NULL, NULL, 0),
(25, 13, 11, 'Cake of the Day', 1, 4.50, NULL, NULL, 0),
(26, 13, 13, 'Brunch Plate', 1, 8.50, NULL, NULL, 0),
(27, 14, 1, 'Espresso', 1, 2.80, NULL, NULL, 0),
(28, 14, 2, 'Flat White', 1, 3.60, NULL, NULL, 0),
(29, 15, 14, 'Vegan Pastry', 1, 3.50, NULL, NULL, 0),
(30, 15, 8, 'Mug of Peppermint Tea', 1, 3.50, NULL, NULL, 0),
(31, 16, 4, 'Latte', 1, 3.80, NULL, NULL, 0),
(32, 16, 11, 'Cake of the Day', 1, 4.50, NULL, NULL, 0),
(33, 16, 12, 'Sandwich', 1, 6.00, NULL, NULL, 0);


-- --------------------------------------------------------

--
-- بنية الجدول `product_reviews`
--

CREATE TABLE `product_reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `reviewer_name` varchar(255) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `rating` tinyint(1) DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `product_reviews`
--

INSERT INTO `product_reviews` (`id`, `product_id`, `reviewer_name`, `comment`, `rating`, `created_at`) VALUES
(1, 10, 'Customer', 'Delicious', 5, '2026-04-30 20:34:02'),
(2, 3, 'Customer', 'Delicious', 5, '2026-04-30 20:46:24');

-- --------------------------------------------------------

--
-- بنية الجدول `recipes`
--

CREATE TABLE `recipes` (
  `recipe_id` int(11) NOT NULL,
  `menu_item_id` int(11) DEFAULT NULL,
  `inventory_id` int(11) DEFAULT NULL,
  `quantity_required` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- إرجاع أو استيراد بيانات الجدول `recipes`
--

INSERT INTO `recipes` (`recipe_id`, `menu_item_id`, `inventory_id`, `quantity_required`) VALUES
(2, 2, 1, 0.02),
(3, 2, 2, 0.20),
(16, 12, 10, 1.00),
(17, 12, 12, 0.10);

-- --------------------------------------------------------

--
-- بنية الجدول `store_reviews`
--

CREATE TABLE `store_reviews` (
  `id` int(11) NOT NULL,
  `reviewer_name` varchar(255) DEFAULT 'Anonymous',
  `comment` text DEFAULT NULL,
  `rating` tinyint(1) DEFAULT 5,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `ai_insights_cache`
--
ALTER TABLE `ai_insights_cache`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `careers`
--
ALTER TABLE `careers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `general_feedback`
--
ALTER TABLE `general_feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_applications`
--
ALTER TABLE `job_applications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `menu_item_addons`
--
ALTER TABLE `menu_item_addons`
  ADD PRIMARY KEY (`menu_item_id`,`addon_id`),
  ADD KEY `addon_id` (`addon_id`);

--
-- Indexes for table `offers`
--
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_order` (`order_id`);

--
-- Indexes for table `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`recipe_id`),
  ADD KEY `menu_item_id` (`menu_item_id`),
  ADD KEY `inventory_id` (`inventory_id`);

--
-- Indexes for table `store_reviews`
--
ALTER TABLE `store_reviews`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `ai_insights_cache`
--
ALTER TABLE `ai_insights_cache`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `careers`
--
ALTER TABLE `careers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `general_feedback`
--
ALTER TABLE `general_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `job_applications`
--
ALTER TABLE `job_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `offers`
--
ALTER TABLE `offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `product_reviews`
--
ALTER TABLE `product_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `recipes`
--
ALTER TABLE `recipes`
  MODIFY `recipe_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `store_reviews`
--
ALTER TABLE `store_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- قيود الجداول المُلقاة.
--

--
-- قيود الجداول `addons`
--
ALTER TABLE `addons`
  ADD CONSTRAINT `addons_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`);

--
-- قيود الجداول `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- قيود الجداول `menu_item_addons`
--
ALTER TABLE `menu_item_addons`
  ADD CONSTRAINT `menu_item_addons_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `menu_item_addons_ibfk_2` FOREIGN KEY (`addon_id`) REFERENCES `addons` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `product_reviews`
--
ALTER TABLE `product_reviews`
  ADD CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `menu_items` (`id`) ON DELETE CASCADE;

--
-- قيود الجداول `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`),
  ADD CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
