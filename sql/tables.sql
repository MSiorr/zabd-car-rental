-- ============================================================
-- 01: TABELE - CarRental DB
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Vehicle_Attribute, Vehicle_Images, Audit_Logs,
  Payments, Reservations, Promotions, Maintenance_Log,
  Vehicles, Vehicle_Categories, Branches, Users, System_Config, Attributes;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE System_Config (
  Config_Key   VARCHAR(100) NOT NULL,
  Config_Value VARCHAR(255) NOT NULL,
  PRIMARY KEY (Config_Key)
);

CREATE TABLE Branches (
  Id      INT          NOT NULL AUTO_INCREMENT,
  Name    VARCHAR(100) NOT NULL,
  City    VARCHAR(100) NOT NULL,
  Address VARCHAR(255) NOT NULL,
  PRIMARY KEY (Id)
);

CREATE TABLE Vehicle_Categories (
  Id               INT            NOT NULL AUTO_INCREMENT,
  Name             VARCHAR(100)   NOT NULL,
  Base_Multiplier  DECIMAL(4,2)   NOT NULL DEFAULT 1.00,
  PRIMARY KEY (Id)
);

CREATE TABLE Vehicles (
  Id                  INT            NOT NULL AUTO_INCREMENT,
  Category_Id         INT            NOT NULL,
  Branch_Id           INT            NOT NULL,
  Status              ENUM('available','rented','maintenance','retired') NOT NULL DEFAULT 'available',
  VIN                 VARCHAR(17)    NOT NULL UNIQUE,
  License_Plate       VARCHAR(20)    NOT NULL UNIQUE,
  Base_Price_Per_Day  DECIMAL(10,2)  NOT NULL,
  PRIMARY KEY (Id),
  CONSTRAINT fk_vehicle_category FOREIGN KEY (Category_Id) REFERENCES Vehicle_Categories(Id),
  CONSTRAINT fk_vehicle_branch   FOREIGN KEY (Branch_Id)   REFERENCES Branches(Id)
);

CREATE TABLE Maintenance_Log (
  Id          INT            NOT NULL AUTO_INCREMENT,
  Vehicle_Id  INT            NOT NULL,
  Start_Date  DATETIME       NOT NULL,
  End_Date    DATETIME       NULL,
  Cost        DECIMAL(10,2)  NULL,
  Description TEXT           NOT NULL,
  PRIMARY KEY (Id),
  CONSTRAINT fk_mlog_vehicle FOREIGN KEY (Vehicle_Id) REFERENCES Vehicles(Id)
);

CREATE TABLE Users (
  Id              INT           NOT NULL AUTO_INCREMENT,
  Role            ENUM('admin','employee','client') NOT NULL DEFAULT 'client',
  First_Name      VARCHAR(100)  NOT NULL,
  Last_Name       VARCHAR(100)  NOT NULL,
  Email           VARCHAR(150)  NOT NULL UNIQUE,
  Password_Hash   VARCHAR(255)  NOT NULL,
  Driving_License VARCHAR(50)   NOT NULL,
  Loyalty_Points  INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (Id)
);

CREATE TABLE Promotions (
  Id               INT           NOT NULL AUTO_INCREMENT,
  Promo_Code       VARCHAR(50)   NOT NULL UNIQUE,
  Discount_Percent DECIMAL(5,2)  NOT NULL,
  Valid_From       DATETIME      NOT NULL,
  Valid_To         DATETIME      NOT NULL,
  Min_Rental_Days  INT           NOT NULL DEFAULT 1,
  PRIMARY KEY (Id)
);

CREATE TABLE Reservations (
  Id                INT           NOT NULL AUTO_INCREMENT,
  User_Id           INT           NOT NULL,
  Vehicle_Id        INT           NOT NULL,
  PickUp_Branch_Id  INT           NOT NULL,
  DropOff_Branch_Id INT           NOT NULL,
  Promo_Id          INT           NULL,
  Status            ENUM('pending_payment','confirmed','active', 'completed','cancelled') NOT NULL DEFAULT 'pending_payment',
  Start_Date        DATETIME      NOT NULL,
  End_Date          DATETIME      NOT NULL,
  Estimated_Cost    DECIMAL(10,2) NOT NULL,
  Final_Cost        DECIMAL(10,2) NULL,
  Created_At        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Id),
  CONSTRAINT fk_res_user     FOREIGN KEY (User_Id)           REFERENCES Users(Id),
  CONSTRAINT fk_res_vehicle  FOREIGN KEY (Vehicle_Id)        REFERENCES Vehicles(Id),
  CONSTRAINT fk_res_pickup   FOREIGN KEY (PickUp_Branch_Id)  REFERENCES Branches(Id),
  CONSTRAINT fk_res_dropoff  FOREIGN KEY (DropOff_Branch_Id) REFERENCES Branches(Id),
  CONSTRAINT fk_res_promo    FOREIGN KEY (Promo_Id)          REFERENCES Promotions(Id)
);

CREATE TABLE Payments (
  Id              INT            NOT NULL AUTO_INCREMENT,
  Reservation_Id  INT            NOT NULL,
  Amount          DECIMAL(10,2)  NOT NULL,
  Payment_Type    ENUM('Deposit','Final','Penalty') NOT NULL,
  Payment_Date    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Id),
  CONSTRAINT fk_payment_res FOREIGN KEY (Reservation_Id) REFERENCES Reservations(Id)
);

CREATE TABLE Audit_Logs (
  Id          INT          NOT NULL AUTO_INCREMENT,
  Table_Name  VARCHAR(50)  NOT NULL,
  Record_Id   INT          NOT NULL,
  Action_Type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  Old_Values  JSON         NULL,
  New_Values  JSON         NULL,
  Changed_At  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Changed_By  INT          NULL,
  PRIMARY KEY (Id),
  INDEX idx_audit_table_record (Table_Name, Record_Id),
  INDEX idx_audit_time (Changed_At)
);

CREATE TABLE Vehicle_Images (
  Id          INT           NOT NULL AUTO_INCREMENT,
  Vehicle_Id  INT           NOT NULL,
  Image_Path  VARCHAR(512)  NOT NULL,
  Is_Main     BOOLEAN       NOT NULL DEFAULT FALSE,
  Description VARCHAR(100)  NOT NULL DEFAULT '',
  PRIMARY KEY (Id),
  CONSTRAINT fk_img_vehicle FOREIGN KEY (Vehicle_Id) REFERENCES Vehicles(Id)
);

CREATE TABLE Attributes (
  Id   INT          NOT NULL AUTO_INCREMENT,
  Name VARCHAR(100) NOT NULL UNIQUE,
  Type ENUM('STRING','NUMBER','DATE','BOOLEAN') NOT NULL,
  PRIMARY KEY (Id)
);

CREATE TABLE Vehicle_Attribute (
  Vehicle_Id    INT            NOT NULL,
  Attribute_Id  INT            NOT NULL,
  Value_String  VARCHAR(255)   NULL,
  Value_Number  DECIMAL(15,2)  NULL,
  Value_Date    DATE           NULL,
  Value_Bool    BOOLEAN        NULL,
  PRIMARY KEY (Vehicle_Id, Attribute_Id),
  CONSTRAINT fk_vattr_vehicle   FOREIGN KEY (Vehicle_Id)   REFERENCES Vehicles(Id),
  CONSTRAINT fk_vattr_attribute FOREIGN KEY (Attribute_Id) REFERENCES Attributes(Id)
);