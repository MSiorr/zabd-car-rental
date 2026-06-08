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
  ('admin',    'Jan',   'Kowalski',    'jan@carental.pl',   '$2b$10$placeholder', 'ADM/001/2020'),
  ('employee', 'Anna',  'Nowak',       'anna@carental.pl',  '$2b$10$placeholder', 'EMP/002/2021'),
  ('employee', 'Test',  'Employee',    'emp@test.com', '$2b$10$8U5mT7LQx2L0zQ0Wm7M9W.N9fD1mTgKfK9Qq3A6n6x8m0R6d2kT7G', 'EMP/003/2026'),
  ('client',   'Piotr', 'Wiśniewski',  'piotr@example.com', '$2b$10$placeholder', 'ABC/123456'),
  ('client',   'Maria', 'Lewandowska', 'maria@example.com', '$2b$10$placeholder', 'XYZ/777777'),
  ('client',   'Tomasz','Zieliński',   'tomasz@example.com','$2b$10$placeholder', 'QWE/888888');

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

INSERT INTO Vehicle_Attribute (Vehicle_Id, Attribute_Id, Value_String, Value_Number, Value_Bool) VALUES
  (1, 1, 'Toyota', NULL, NULL), (1, 2, 'Yaris', NULL, NULL), (1, 3, NULL, 2024, NULL), (1, 4, 'Manualna', NULL, NULL), (1, 5, 'Benzyna', NULL, NULL), (1, 6, NULL, 5, NULL), (1, 7, NULL, NULL, TRUE),
  (2, 1, 'Volkswagen', NULL, NULL), (2, 2, 'Golf', NULL, NULL), (2, 3, NULL, 2025, NULL), (2, 4, 'Automatyczna', NULL, NULL), (2, 5, 'Hybryda', NULL, NULL), (2, 6, NULL, 5, NULL), (2, 7, NULL, NULL, TRUE),
  (3, 1, 'Audi', NULL, NULL), (3, 2, 'Q5', NULL, NULL), (3, 3, NULL, 2025, NULL), (3, 4, 'Automatyczna', NULL, NULL), (3, 5, 'Diesel', NULL, NULL), (3, 6, NULL, 5, NULL), (3, 7, NULL, NULL, TRUE),
  (4, 1, 'BMW', NULL, NULL), (4, 2, 'Seria 5', NULL, NULL), (4, 3, NULL, 2024, NULL), (4, 4, 'Automatyczna', NULL, NULL), (4, 5, 'Benzyna', NULL, NULL), (4, 6, NULL, 5, NULL), (4, 7, NULL, NULL, TRUE);

INSERT INTO Vehicle_Images (Vehicle_Id, Image_Path, Is_Main, Description) VALUES
  (1, '/vehicles/yaris-main.jpg', TRUE, 'Przód'), (1, '/vehicles/yaris-2.jpg', FALSE, 'Wnętrze'), (1, '/vehicles/yaris-3.jpg', FALSE, 'Tył'),
  (2, '/vehicles/golf-main.jpg', TRUE, 'Przód'), (2, '/vehicles/golf-2.jpg', FALSE, 'Wnętrze'),
  (3, '/vehicles/audi-q5-main.jpg', TRUE, 'Przód'), (3, '/vehicles/audi-q5-2.jpg', FALSE, 'Tył'),
  (4, '/vehicles/bmw-main.jpg', TRUE, 'Przód'), (4, '/vehicles/bmw-2.jpg', FALSE, 'Tył');

-- Słownik usterek (cennik bazowy — pracownik może nadpisać kwotę przy zwrocie)
INSERT INTO Damage_Types (Name, Default_Cost) VALUES
  ('Rysa na lakierze',        300.00),
  ('Wgniecenie karoserii',    800.00),
  ('Uszkodzona felga',        500.00),
  ('Pęknięta szyba',         1200.00),
  ('Zniszczone wnętrze',      600.00),
  ('Zwrot z pustym bakiem',   250.00),
  ('Zgubiony kluczyk',        900.00);

-- ── DANE HISTORYCZNE (zakończone wynajmy) — zasilają podsumowanie miesięczne ──
-- Wstawiane przed załadowaniem logic.sql, więc triggery jeszcze nie istnieją.
INSERT INTO Reservations
  (User_Id, Vehicle_Id, PickUp_Branch_Id, DropOff_Branch_Id, Promo_Id, Status, Start_Date, End_Date, Estimated_Cost, Final_Cost, Created_At) VALUES
  (4, 1, 1, 1, NULL, 'completed', '2026-01-10 12:00:00', '2026-01-14 12:00:00',  600.00,  750.00, '2026-01-09 10:00:00'),
  (5, 2, 1, 1, NULL, 'completed', '2026-02-05 12:00:00', '2026-02-09 12:00:00', 1000.00, 1000.00, '2026-02-04 10:00:00'),
  (6, 3, 2, 2, NULL, 'completed', '2026-03-12 12:00:00', '2026-03-16 12:00:00', 1280.00, 1580.00, '2026-03-11 10:00:00'),
  (4, 2, 1, 1, NULL, 'completed', '2026-04-02 12:00:00', '2026-04-05 12:00:00',  750.00,  750.00, '2026-04-01 10:00:00'),
  (5, 1, 1, 1, NULL, 'completed', '2026-05-08 12:00:00', '2026-05-12 12:00:00',  900.00, 1200.00, '2026-05-07 10:00:00'),
  (6, 3, 2, 2, NULL, 'completed', '2026-05-20 12:00:00', '2026-05-25 12:00:00', 1600.00, 1600.00, '2026-05-19 10:00:00');

-- Płatności do powyższych: Final = przychód z najmu, Penalty = kary, Damage = uszkodzenia
INSERT INTO Payments (Reservation_Id, Amount, Payment_Type, Status, Description, Payment_Date) VALUES
  (1,  600.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-01-09 10:05:00'),
  (1,  150.00, 'Penalty', 'paid', 'Kara za 1 dzień opóźnienia',   '2026-01-14 16:00:00'),
  (2, 1000.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-02-04 10:05:00'),
  (3, 1280.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-03-11 10:05:00'),
  (3,  300.00, 'Damage',  'paid', 'Rysa na lakierze',             '2026-03-16 15:00:00'),
  (4,  750.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-04-01 10:05:00'),
  (5,  900.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-05-07 10:05:00'),
  (5,  300.00, 'Penalty', 'paid', 'Kara za 2 dni opóźnienia',     '2026-05-12 17:00:00'),
  (6, 1600.00, 'Final',   'paid', 'Opłata za wynajem',            '2026-05-19 10:05:00');