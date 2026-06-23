-- ========================================================
-- AVAADA BOOKINGS: LOCAL DEMO MASTER SEED SCRIPT
-- Database: avaada_one
-- ========================================================

DROP TABLE IF EXISTS booking_participants CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS room_amenities CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS admin_directory CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP SEQUENCE IF EXISTS bookings_id_seq CASCADE;

CREATE TABLE users (
    id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_id VARCHAR(50)
);

CREATE TABLE offices (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) 
);

CREATE TABLE amenities (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE admin_directory (
    id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_name VARCHAR(100),
    office_name VARCHAR(255)
);

CREATE TABLE rooms (
    id INT PRIMARY KEY,
    office_id INT REFERENCES offices(id),
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE room_amenities (
    room_id INT REFERENCES rooms(id),
    amenity_id INT REFERENCES amenities(id),
    PRIMARY KEY (room_id, amenity_id)
);

CREATE SEQUENCE bookings_id_seq START WITH 5000;

CREATE TABLE bookings (
    id INT PRIMARY KEY DEFAULT nextval('bookings_id_seq'),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    final_approval VARCHAR(50) DEFAULT 'APPROVED',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    frequency VARCHAR(50) DEFAULT 'NONE',
    room_id INT REFERENCES rooms(id),
    user_id INT REFERENCES users(id)
);

CREATE TABLE booking_participants (
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id),
    PRIMARY KEY (booking_id, user_id)
);

INSERT INTO users (id, full_name, email, employee_id) VALUES 
(123, 'Test User', 'test.user@avaada.com', '20189'),
(456, 'Guest User', 'guest.user@avaada.com', '20190');

INSERT INTO offices (id, name, location) VALUES 
(1, 'Dadri', 'Dadri'), 
(2, 'Delhi', 'Delhi'), 
(3, 'Mumbai', 'Mumbai'), 
(4, 'Noida 62 - Tower B Ground Floor', 'Noida'), 
(5, 'Noida-62 - Tower A 5th Floor', 'Noida'), 
(6, 'Noida-65', 'Noida'), 
(7, 'Noida - 62 Tower C 4th Floor', 'Noida'), 
(8, 'Butibori', 'Butibori'),
(999, 'Test Office (Demo Mode)', 'Virtual');

INSERT INTO amenities (id, name) VALUES 
(1, 'Projector'), (2, 'Whiteboard'), (3, 'WiFi'), 
(4, 'Monitor'), (5, 'Video Conferencing');

INSERT INTO admin_directory (id, full_name, email, role_name, office_name) VALUES 
(1, 'Sanjay Gupta', 'sanjay.gupta@avaada.com', 'FACILITY ADMIN', 'Gurgaon Office'),
(2, 'Priya Sharma', 'priya.sharma@avaada.com', 'IT SUPPORT', 'Noida-62');

INSERT INTO rooms (id, office_id, name, capacity) VALUES 
(101, 999, 'Room-1', 12),
(102, 999, 'Room-2', 4),
(103, 7, 'Noida Room-1', 20),
(104, 7, 'Noida Room-2', 4),
(105, 1, 'Dadri Room', 10);

INSERT INTO room_amenities (room_id, amenity_id) VALUES 
(101, 3), (101, 1), (101, 5),
(102, 4), (102, 2),
(103, 1), (103, 2), (103, 3), (103, 5),
(104, 2), (104, 3);

INSERT INTO bookings (id, title, status, final_approval, start_date, end_date, start_time, end_time, room_id, user_id) VALUES 
(101, 'Past: Morning Standup', 'ACTIVE', 'APPROVED', CURRENT_DATE, CURRENT_DATE, '06:00:00', '06:30:00', 101, 123),
(102, 'Upcoming: Q3 Strategy Review', 'ACTIVE', 'APPROVED', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', '11:00:00', '13:00:00', 103, 123),
(103, 'Cancelled: Vendor Sync', 'CANCELLED', 'REJECTED', CURRENT_DATE, CURRENT_DATE, '14:00:00', '15:00:00', 102, 123);

INSERT INTO booking_participants (booking_id, user_id) VALUES 
(102, 456);