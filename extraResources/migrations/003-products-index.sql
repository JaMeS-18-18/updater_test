CREATE INDEX idx_product_barcode
ON products (barcode);

CREATE INDEX idx_product_barcode_name
ON products (barcode, productNameLower);

-- CREATE TABLE IF NOT EXISTS products (
-- 	id INTEGER PRIMARY KEY AUTOINCREMENT,
-- 	balance VARCHAR (50),
-- 	balanceId INTEGER,
-- 	barcode VARCHAR (50),
-- 	barcodeScales VARCHAR (50),
-- 	currencyId VARCHAR (50),
-- 	modificationList TEXT,
-- 	price VARCHAR (11),
-- 	productGroupId VARCHAR(50),
-- 	productId VARCHAR (50),
-- 	productImageUrl VARCHAR (50),
-- 	productName VARCHAR (50),
-- 	productNameLower VARCHAR (50),
-- 	salePrice VARCHAR (50),
-- 	unitList TEXT,
-- 	uomId INTEGER,
-- 	vat BOOLEAN,
-- 	wholesalePrice VARCHAR (50)
-- )