-- ============================================================
-- 02: DANE TESTOWE - CarRental DB
-- ============================================================

INSERT INTO System_Config VALUES
  ('late_penalty_per_day',   '150.00'),
  ('weekend_multiplier',     '1.20'),
  ('high_season_multiplier', '1.35'),
  ('high_season_start',      '07-01'),
  ('high_season_end',        '08-31'),
  ('payment_timeout_hours',  '24')
ON DUPLICATE KEY UPDATE Config_Value=VALUES(Config_Value);

INSERT INTO Branches (Name, City, Address) VALUES
  ('Centrum', 'Warszawa', 'ul. Marszałkowska 1'),
  ('Lotnisko', 'Warszawa', 'ul. Żwirki i Wigury 1'),
  ('Stare Miasto', 'Kraków', 'ul. Floriańska 5');

INSERT INTO Vehicle_Categories (Name, Base_Multiplier) VALUES
  ('Ekonomiczny', 1.00),
  ('Komfort',     1.40),
  ('SUV',         1.70),
  ('Premium',     2.50);

INSERT INTO Users (Role, First_Name, Last_Name, Email, Password_Hash, Driving_License) VALUES
  ('admin',    'Jan',  'Kowalski',   'jan@carental.pl',   '$2b$10$placeholder', 'ADM/001/2020'),
  ('employee', 'Anna', 'Nowak',      'anna@carental.pl',  '$2b$10$placeholder', 'EMP/002/2021'),
  ('client',   'Piotr','Wiśniewski', 'piotr@example.com', '$2b$10$placeholder', 'ABC/123456');

INSERT INTO Vehicles (Category_Id, Branch_Id, Status, VIN, License_Plate, Base_Price_Per_Day) VALUES
  (1, 1, 'available', 'WBA12345678901234', 'WW 12345', 150.00),
  (2, 1, 'available', 'WDB98765432109876', 'WW 67890', 250.00),
  (3, 2, 'available', 'JN1AB6AP4BM372816', 'WW 11111', 320.00),
  (4, 3, 'maintenance','WBAFR7C57BC123456', 'KR 99999', 600.00);

INSERT INTO Attributes (Name, Type) VALUES
  ('Marka',          'STRING'),
  ('Model',          'STRING'),
  ('Rok produkcji',  'NUMBER'),
  ('Skrzynia biegów','STRING'),
  ('Paliwo',         'STRING'),
  ('Liczba miejsc',  'NUMBER'),
  ('Klimatyzacja',   'BOOLEAN');

INSERT INTO Promotions (Promo_Code, Discount_Percent, Valid_From, Valid_To, Min_Rental_Days) VALUES
  ('LATO2026', 15.00, '2026-06-01', '2026-08-31', 3),
  ('WEEKEND',  10.00, '2026-01-01', '2026-12-31', 2);