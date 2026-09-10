-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 10, 2026 at 03:41 AM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730202751`
--

-- --------------------------------------------------------

--
-- Table structure for table `bicycles`
--

CREATE TABLE `bicycles` (
  `id` int NOT NULL,
  `bike_name` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อรุ่นจักรยาน',
  `brand` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ยี่ห้อจักรยาน',
  `price` int NOT NULL COMMENT 'ราคา',
  `stock_qty` int NOT NULL COMMENT 'จำนวนคงเหลือ',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ประเภทจักรยาน',
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รูปภาพจักรยาน',
  `lastUpdate` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bicycles`
--

INSERT INTO `bicycles` (`id`, `bike_name`, `brand`, `price`, `stock_qty`, `category`, `image`, `lastUpdate`) VALUES
(1, 'Trek Marlin 7', 'Trek', 25000, 10, 'เสือภูเขา', 'https://tse3.mm.bing.net/th/id/OIP.LlkyIMHy9rGnYmzwld0ImgHaFj?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', '2026-09-10 03:40:28'),
(16, 'Giant Escape 3', 'Giant', 6200, 15, 'City Bike', 'https://example.com/images/escape3.jpg', '2026-09-10 03:40:28'),
(17, 'Specialized Allez', 'Specialized', 66500, 5, 'Road Bike', 'https://example.com/images/allez.jpg', '2026-09-10 03:40:28'),
(18, 'Cannondale Trail 5', 'Cannondale', 24000, 8, 'Mountain Bike', 'https://example.com/images/trail5.jpg', '2026-09-10 03:40:28'),
(19, 'Bianchi Nirone 7', 'Bianchi', 65000, 6, 'Road Bike', 'https://example.com/images/nirone7.jpg', '2026-09-10 03:40:28'),
(20, 'JAVA Siluro 3', 'JAVA', 23000, 12, 'Road Bike', 'https://example.com/images/siluro3.jpg', '2026-09-10 03:40:28'),
(21, 'LA Bicycle Spark', 'LA Bicycle', 5000, 20, 'City Bike', 'https://example.com/images/spark.jpg', '2026-09-10 03:40:28'),
(22, 'Trinx M100', 'Trinx', 5800, 18, 'Mountain Bike', 'https://example.com/images/m100.jpg', '2026-09-10 03:40:28'),
(23, 'Brompton C Line', 'Brompton', 68000, 4, 'Folding Bike', 'https://example.com/images/cline.jpg', '2026-09-10 03:21:48'),
(24, 'Dahon K3', 'Dahon', 22000, 9, 'Folding Bike', 'https://example.com/images/k3.jpg', '2026-09-10 03:40:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bicycles`
--
ALTER TABLE `bicycles`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bicycles`
--
ALTER TABLE `bicycles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
