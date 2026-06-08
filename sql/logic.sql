-- ============================================================
-- 03: LOGIKA, WIDOKI, PROCEDURY - CarRental DB
-- ============================================================

-- Czyszczenie starych obiektów (pozwala na wielokrotne odpalanie skryptu)
DROP FUNCTION IF EXISTS calculate_final_rate;
DROP PROCEDURE IF EXISTS calculate_rate_breakdown;
DROP PROCEDURE IF EXISTS create_reservation;
DROP PROCEDURE IF EXISTS return_vehicle;
DROP PROCEDURE IF EXISTS process_overdue_reservations;
DROP PROCEDURE IF EXISTS cancel_unpaid_reservations;
DROP PROCEDURE IF EXISTS report_monthly_summary;
DROP TRIGGER IF EXISTS before_reservation_insert;
DROP TRIGGER IF EXISTS after_reservation_update;
DROP TRIGGER IF EXISTS after_reservation_delete;
DROP EVENT IF EXISTS auto_cancel_pending;

DELIMITER $$

-- ── FUNKCJA: calculate_final_rate ─────────────────────────────
CREATE FUNCTION calculate_final_rate(
  p_vehicle_id    INT,
  p_start_date    DATETIME,
  p_end_date      DATETIME,
  p_promo_id      INT
) RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_base_price      DECIMAL(10,2);
  DECLARE v_cat_multiplier  DECIMAL(4,2);
  DECLARE v_days            INT;
  DECLARE v_weekend_days    INT;
  DECLARE v_season_mult     DECIMAL(4,2);
  DECLARE v_weekend_mult    DECIMAL(4,2);
  DECLARE v_discount        DECIMAL(5,2);
  DECLARE v_total           DECIMAL(10,2);
  DECLARE v_min_days        INT;
  DECLARE v_season_start    VARCHAR(5);
  DECLARE v_season_end      VARCHAR(5);

  SELECT v.Base_Price_Per_Day, vc.Base_Multiplier
  INTO v_base_price, v_cat_multiplier
  FROM Vehicles v
  JOIN Vehicle_Categories vc ON v.Category_Id = vc.Id
  WHERE v.Id = p_vehicle_id;

  SET v_days = GREATEST(1, DATEDIFF(p_end_date, p_start_date));

  SELECT Config_Value INTO v_weekend_mult FROM System_Config WHERE Config_Key = 'weekend_multiplier';
  SELECT Config_Value INTO v_season_mult  FROM System_Config WHERE Config_Key = 'high_season_multiplier';
  SELECT Config_Value INTO v_season_start FROM System_Config WHERE Config_Key = 'high_season_start';
  SELECT Config_Value INTO v_season_end   FROM System_Config WHERE Config_Key = 'high_season_end';

  SET v_weekend_days = (
    SELECT COUNT(*) FROM (
      SELECT DATE_ADD(DATE(p_start_date), INTERVAL n DAY) AS d
      FROM (
        SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION
        SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION
        SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION
        SELECT 12 UNION SELECT 13 UNION SELECT 14
      ) nums
      WHERE n < v_days
    ) days_table
    WHERE DAYOFWEEK(d) IN (1, 7)
  );

  SET v_season_mult = IF(
    DATE_FORMAT(p_start_date, '%m-%d') <= v_season_end
    AND DATE_FORMAT(p_end_date, '%m-%d') >= v_season_start,
    v_season_mult, 1.00
  );

  SET v_total = v_base_price * v_cat_multiplier * ((v_days - v_weekend_days) * 1.00 + v_weekend_days * v_weekend_mult) * v_season_mult;

  IF p_promo_id IS NOT NULL THEN
    SELECT Discount_Percent, Min_Rental_Days
    INTO v_discount, v_min_days
    FROM Promotions
    WHERE Id = p_promo_id
      AND NOW() BETWEEN Valid_From AND Valid_To;

    IF v_discount IS NOT NULL AND v_days >= v_min_days THEN
      SET v_total = v_total * (1 - v_discount / 100);
    END IF;
  END IF;

  RETURN ROUND(v_total, 2);
END$$

-- ── PROCEDURA: calculate_rate_breakdown ───────────────────────
CREATE PROCEDURE calculate_rate_breakdown(
  IN p_vehicle_id INT,
  IN p_start_date DATETIME,
  IN p_end_date   DATETIME,
  IN p_promo_id   INT
)
BEGIN
  DECLARE v_base_price      DECIMAL(10,2);
  DECLARE v_cat_multiplier  DECIMAL(4,2);
  DECLARE v_category        VARCHAR(100);
  DECLARE v_days            INT;
  DECLARE v_weekend_days    INT;
  DECLARE v_weekday_days    INT;
  DECLARE v_season_mult     DECIMAL(4,2);
  DECLARE v_weekend_mult    DECIMAL(4,2);
  DECLARE v_season_applies  BOOLEAN DEFAULT FALSE;
  DECLARE v_discount        DECIMAL(5,2) DEFAULT 0;
  DECLARE v_min_days        INT DEFAULT 0;
  DECLARE v_promo_applies   BOOLEAN DEFAULT FALSE;
  DECLARE v_daily_rate      DECIMAL(10,2);
  DECLARE v_weekday_cost    DECIMAL(10,2);
  DECLARE v_weekend_cost    DECIMAL(10,2);
  DECLARE v_subtotal        DECIMAL(10,2);
  DECLARE v_after_season    DECIMAL(10,2);
  DECLARE v_discount_amount DECIMAL(10,2) DEFAULT 0;
  DECLARE v_total           DECIMAL(10,2);
  DECLARE v_season_start    VARCHAR(5);
  DECLARE v_season_end      VARCHAR(5);

  SELECT v.Base_Price_Per_Day, vc.Base_Multiplier, vc.Name
  INTO v_base_price, v_cat_multiplier, v_category
  FROM Vehicles v
  JOIN Vehicle_Categories vc ON v.Category_Id = vc.Id
  WHERE v.Id = p_vehicle_id;

  SET v_days = GREATEST(1, DATEDIFF(p_end_date, p_start_date));

  SELECT Config_Value INTO v_weekend_mult FROM System_Config WHERE Config_Key = 'weekend_multiplier';
  SELECT Config_Value INTO v_season_mult  FROM System_Config WHERE Config_Key = 'high_season_multiplier';
  SELECT Config_Value INTO v_season_start FROM System_Config WHERE Config_Key = 'high_season_start';
  SELECT Config_Value INTO v_season_end   FROM System_Config WHERE Config_Key = 'high_season_end';

  SET v_weekend_days = (
    SELECT COUNT(*) FROM (
      SELECT DATE_ADD(DATE(p_start_date), INTERVAL n DAY) AS d
      FROM (
        SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION
        SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION
        SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION
        SELECT 12 UNION SELECT 13 UNION SELECT 14
      ) nums
      WHERE n < v_days
    ) days_table
    WHERE DAYOFWEEK(d) IN (1, 7)
  );
  SET v_weekday_days = v_days - v_weekend_days;

  SET v_season_applies = (
    DATE_FORMAT(p_start_date, '%m-%d') <= v_season_end
    AND DATE_FORMAT(p_end_date, '%m-%d') >= v_season_start
  );
  IF NOT v_season_applies THEN SET v_season_mult = 1.00; END IF;

  SET v_daily_rate   = v_base_price * v_cat_multiplier;
  SET v_weekday_cost = v_daily_rate * v_weekday_days;
  SET v_weekend_cost = v_daily_rate * v_weekend_days * v_weekend_mult;
  SET v_subtotal     = v_weekday_cost + v_weekend_cost;
  SET v_after_season = v_subtotal * v_season_mult;

  IF p_promo_id IS NOT NULL THEN
    SELECT Discount_Percent, Min_Rental_Days
    INTO v_discount, v_min_days
    FROM Promotions
    WHERE Id = p_promo_id AND NOW() BETWEEN Valid_From AND Valid_To;

    IF v_discount IS NOT NULL AND v_days >= v_min_days THEN
      SET v_promo_applies   = TRUE;
      SET v_discount_amount = v_after_season * v_discount / 100;
    END IF;
  END IF;

  SET v_total = ROUND(v_after_season - v_discount_amount, 2);

  SELECT
    v_base_price                  AS base_price,
    v_category                    AS category,
    v_cat_multiplier              AS category_multiplier,
    ROUND(v_daily_rate, 2)        AS daily_rate,
    v_days                        AS total_days,
    v_weekday_days                AS weekday_days,
    v_weekend_days                AS weekend_days,
    v_weekend_mult                AS weekend_multiplier,
    ROUND(v_weekday_cost, 2)      AS weekday_cost,
    ROUND(v_weekend_cost, 2)      AS weekend_cost,
    v_season_applies              AS season_applies,
    v_season_mult                 AS season_multiplier,
    ROUND(v_after_season, 2)      AS subtotal,
    v_promo_applies               AS promo_applies,
    COALESCE(v_discount, 0)       AS discount_percent,
    ROUND(v_discount_amount, 2)   AS discount_amount,
    v_total                       AS total;
END$$

-- ── PROCEDURA: create_reservation (z naprawionym statusem) ────
CREATE PROCEDURE create_reservation(
  IN  p_user_id     INT,
  IN  p_vehicle_id  INT,
  IN  p_pickup_id   INT,
  IN  p_dropoff_id  INT,
  IN  p_start_date  DATETIME,
  IN  p_end_date    DATETIME,
  IN  p_promo_id    INT,
  OUT p_res_id      INT,
  OUT p_status_msg  VARCHAR(255)
)
BEGIN
  DECLARE v_vehicle_status  VARCHAR(20);
  DECLARE v_overlap         INT DEFAULT 0;
  DECLARE v_estimated_cost  DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_res_id = -1;
    SET p_status_msg = 'Błąd bazy danych — transakcja wycofana.';
  END;

  START TRANSACTION;

  SELECT Status INTO v_vehicle_status
  FROM Vehicles
  WHERE Id = p_vehicle_id
  FOR UPDATE;

  IF v_vehicle_status != 'available' THEN
    ROLLBACK;
    SET p_res_id = -1;
    SET p_status_msg = CONCAT('Pojazd niedostępny. Status: ', v_vehicle_status);
  ELSE
    SELECT COUNT(*) INTO v_overlap
    FROM Reservations
    WHERE Vehicle_Id = p_vehicle_id
      AND Status IN ('pending_payment', 'confirmed', 'active')
      AND NOT (End_Date <= p_start_date OR Start_Date >= p_end_date);

    IF v_overlap > 0 THEN
      ROLLBACK;
      SET p_res_id = -1;
      SET p_status_msg = 'Pojazd jest już zarezerwowany w tym terminie.';
    ELSE
      SET v_estimated_cost = calculate_final_rate(p_vehicle_id, p_start_date, p_end_date, p_promo_id);

      INSERT INTO Reservations
        (User_Id, Vehicle_Id, PickUp_Branch_Id, DropOff_Branch_Id, Promo_Id, Status, Start_Date, End_Date, Estimated_Cost)
      VALUES
        (p_user_id, p_vehicle_id, p_pickup_id, p_dropoff_id, p_promo_id, 'pending_payment', p_start_date, p_end_date, v_estimated_cost);

      SET p_res_id = LAST_INSERT_ID();
      COMMIT;
      SET p_status_msg = 'OK';
    END IF;
  END IF;
END$$

-- ── PROCEDURA: return_vehicle ─────────────────────────────────
CREATE PROCEDURE return_vehicle(
  IN  p_reservation_id  INT,
  IN  p_damage_fee      DECIMAL(10,2),
  OUT p_final_cost      DECIMAL(10,2),
  OUT p_late_fee        DECIMAL(10,2),
  OUT p_status_msg      VARCHAR(255)
)
BEGIN
  DECLARE v_vehicle_id   INT;
  DECLARE v_planned_end  DATETIME;
  DECLARE v_base_cost    DECIMAL(10,2);
  DECLARE v_dropoff      INT;
  DECLARE v_days_late    INT;
  DECLARE v_rate         DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_status_msg = 'Błąd — transakcja wycofana.';
  END;

  START TRANSACTION;

  SELECT Vehicle_Id, End_Date, Estimated_Cost, DropOff_Branch_Id
  INTO v_vehicle_id, v_planned_end, v_base_cost, v_dropoff
  FROM Reservations
  WHERE Id = p_reservation_id AND Status = 'active'
  FOR UPDATE;

  IF v_vehicle_id IS NULL THEN
    ROLLBACK;
    SET p_status_msg = 'Rezerwacja nie istnieje lub nie jest aktywna.';
  ELSE
    SELECT Config_Value INTO v_rate FROM System_Config WHERE Config_Key = 'late_penalty_per_day';

    SET v_days_late  = GREATEST(0, DATEDIFF(NOW(), v_planned_end));
    SET p_late_fee   = v_days_late * v_rate;
    SET p_damage_fee = COALESCE(p_damage_fee, 0);
    SET p_final_cost = v_base_cost + p_late_fee + p_damage_fee;

    DELETE FROM Payments
    WHERE Reservation_Id = p_reservation_id AND Payment_Type = 'Penalty' AND Status = 'pending';

    IF p_late_fee > 0 THEN
      INSERT INTO Payments (Reservation_Id, Amount, Payment_Type, Status, Description)
      VALUES (p_reservation_id, p_late_fee, 'Penalty', 'pending', CONCAT('Kara za ', v_days_late, ' dni opóźnienia'));
    END IF;

    IF p_damage_fee > 0 THEN
      INSERT INTO Payments (Reservation_Id, Amount, Payment_Type, Status, Description)
      VALUES (p_reservation_id, p_damage_fee, 'Damage', 'pending', 'Opłata za uszkodzenia pojazdu');
    END IF;

    UPDATE Reservations SET Status = 'completed', Final_Cost = p_final_cost WHERE Id = p_reservation_id;
    UPDATE Vehicles    SET Status = 'available', Branch_Id = v_dropoff WHERE Id = v_vehicle_id;

    COMMIT;
    SET p_status_msg = 'OK';
  END IF;
END$$

-- ── PROCEDURA: process_overdue_reservations ───────────────────
CREATE PROCEDURE process_overdue_reservations()
BEGIN
  DECLARE done       INT DEFAULT FALSE;
  DECLARE v_res_id   INT;
  DECLARE v_veh_id   INT;
  DECLARE v_end      DATETIME;
  DECLARE v_start    DATETIME;
  DECLARE v_promo    INT;
  DECLARE v_penalty  DECIMAL(10,2);
  DECLARE v_rate     DECIMAL(10,2);
  DECLARE v_days     INT;

  DECLARE cur CURSOR FOR
    SELECT Id, Vehicle_Id, Start_Date, End_Date, Promo_Id
    FROM Reservations
    WHERE Status = 'active' AND End_Date < NOW();

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  SELECT Config_Value INTO v_rate FROM System_Config WHERE Config_Key = 'late_penalty_per_day';

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_res_id, v_veh_id, v_start, v_end, v_promo;
    IF done THEN LEAVE read_loop; END IF;

    SET v_days    = DATEDIFF(NOW(), v_end);
    SET v_penalty = v_days * v_rate;

    DELETE FROM Payments
    WHERE Reservation_Id = v_res_id AND Payment_Type = 'Penalty' AND Status = 'pending';

    INSERT INTO Payments (Reservation_Id, Amount, Payment_Type, Status, Description)
    VALUES (v_res_id, v_penalty, 'Penalty', 'pending', CONCAT('Kara za ', v_days, ' dni opóźnienia (auto)'));

    INSERT INTO Audit_Logs (Table_Name, Record_Id, Action_Type, New_Values)
    VALUES ('Reservations', v_res_id, 'UPDATE', JSON_OBJECT('action','overdue_penalty','days_late',v_days,'penalty',v_penalty));
  END LOOP;
  CLOSE cur;
END$$

-- ── PROCEDURA: cancel_unpaid_reservations ─────────────────────
-- Anuluje rezerwacje "oczekujące na płatność" starsze niż limit z konfiguracji.
-- Wydzielona z eventu, by można było uruchomić ją ręcznie (demo z panelu admina).
CREATE PROCEDURE cancel_unpaid_reservations()
BEGIN
  DECLARE v_timeout INT;
  SELECT Config_Value INTO v_timeout FROM System_Config WHERE Config_Key = 'payment_timeout_hours';

  UPDATE Reservations
  SET Status = 'cancelled'
  WHERE Status = 'pending_payment'
    AND TIMESTAMPDIFF(HOUR, Created_At, NOW()) > v_timeout;
END$$

-- ── WYZWALACZE ────────────────────────────────────────────────
CREATE TRIGGER before_reservation_insert
BEFORE INSERT ON Reservations
FOR EACH ROW
BEGIN
  DECLARE v_status VARCHAR(20);
  SELECT Status INTO v_status FROM Vehicles WHERE Id = NEW.Vehicle_Id;
  IF v_status != 'available' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nie można zarezerwować pojazdu — status różny od available.';
  END IF;
END$$

CREATE TRIGGER after_reservation_update
AFTER UPDATE ON Reservations
FOR EACH ROW
BEGIN
  INSERT INTO Audit_Logs (Table_Name, Record_Id, Action_Type, Old_Values, New_Values)
  VALUES ('Reservations', OLD.Id, 'UPDATE', JSON_OBJECT('status', OLD.Status, 'start', OLD.Start_Date, 'end', OLD.End_Date, 'final_cost', OLD.Final_Cost), JSON_OBJECT('status', NEW.Status, 'start', NEW.Start_Date, 'end', NEW.End_Date, 'final_cost', NEW.Final_Cost));
END$$

CREATE TRIGGER after_reservation_delete
AFTER DELETE ON Reservations
FOR EACH ROW
BEGIN
  INSERT INTO Audit_Logs (Table_Name, Record_Id, Action_Type, Old_Values)
  VALUES ('Reservations', OLD.Id, 'DELETE', JSON_OBJECT('user_id', OLD.User_Id, 'vehicle_id', OLD.Vehicle_Id, 'status', OLD.Status, 'estimated_cost', OLD.Estimated_Cost));
END$$

-- ── ZDARZENIA ─────────────────────────────────────────────────
CREATE EVENT auto_cancel_pending
ON SCHEDULE EVERY 1 HOUR
DO
  CALL cancel_unpaid_reservations()$$

DELIMITER ;

-- ── WIDOKI ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW view_available_fleet AS
SELECT
  v.Id           AS vehicle_id,
  v.License_Plate,
  v.Base_Price_Per_Day,
  v.Status,
  vc.Name        AS category,
  vc.Base_Multiplier AS cat_multiplier,
  b.Name         AS branch_name,
  b.City         AS branch_city,
  vi.Image_Path  AS main_image
FROM Vehicles v
JOIN Vehicle_Categories vc ON v.Category_Id = vc.Id
JOIN Branches b            ON v.Branch_Id = b.Id
LEFT JOIN Vehicle_Images vi ON vi.Vehicle_Id = v.Id AND vi.Is_Main = TRUE
WHERE v.Status = 'available';

CREATE OR REPLACE VIEW view_vehicle_card AS
SELECT
  v.Id, v.VIN, v.License_Plate, v.Status,
  v.Base_Price_Per_Day,
  vc.Name  AS category,
  v.Branch_Id, b.Name AS branch, b.City AS city,
  COALESCE(
    (
      SELECT JSON_OBJECTAGG(
        attr.Name, 
        COALESCE(v_attr.Value_String, CAST(v_attr.Value_Number AS CHAR), CAST(v_attr.Value_Date AS CHAR), IF(v_attr.Value_Bool, 'true','false'))
      )
      FROM Vehicle_Attribute v_attr
      JOIN Attributes attr ON v_attr.Attribute_Id = attr.Id
      WHERE v_attr.Vehicle_Id = v.Id
    ),
    JSON_OBJECT()
  ) AS attributes,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('path', Image_Path, 'main', Is_Main)) FROM Vehicle_Images WHERE Vehicle_Id = v.Id) AS images
FROM Vehicles v
JOIN Vehicle_Categories vc ON v.Category_Id = vc.Id
JOIN Branches b            ON v.Branch_Id   = b.Id
GROUP BY v.Id, v.VIN, v.License_Plate, v.Status, v.Base_Price_Per_Day, vc.Name, b.Name, b.City;

CREATE OR REPLACE VIEW view_monthly_summary AS
SELECT
  YEAR(p.Payment_Date)  AS year,
  MONTH(p.Payment_Date) AS month,
  COUNT(DISTINCT p.Reservation_Id)                                   AS total_reservations,
  SUM(CASE WHEN p.Payment_Type = 'Final'   THEN p.Amount ELSE 0 END) AS revenue,
  SUM(CASE WHEN p.Payment_Type = 'Penalty' THEN p.Amount ELSE 0 END) AS penalties,
  SUM(CASE WHEN p.Payment_Type = 'Damage'  THEN p.Amount ELSE 0 END) AS damages,
  SUM(p.Amount)                                                      AS total_income,
  COUNT(DISTINCT r.User_Id)                                          AS unique_customers
FROM Payments p
JOIN Reservations r ON p.Reservation_Id = r.Id
WHERE p.Status = 'paid'
GROUP BY YEAR(p.Payment_Date), MONTH(p.Payment_Date)
ORDER BY year DESC, month DESC;

-- ── PROCEDURA RAPORTUJĄCA ─────────────────────────────────────
-- Opakowuje widok podsumowania miesięcznego parametrem roku (NULL = wszystko).
-- Demonstruje użycie procedury zwracającej zbiór wynikowy nad widokiem.
DELIMITER $$
CREATE PROCEDURE report_monthly_summary(IN p_year INT)
BEGIN
  SELECT *
  FROM view_monthly_summary
  WHERE p_year IS NULL OR year = p_year
  ORDER BY year DESC, month DESC;
END$$
DELIMITER ;
