CREATE TABLE IF NOT EXISTS deleted_products (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	login VARCHAR(50),
	posId INTEGER,
	cashboxId INTEGER,
	shiftId INTEGER,
	balanceId INTEGER,
	productId VARCHAR (50),
	quantity VARCHAR (50),
	totalPrice VARCHAR (50),
	chequeDate VARCHAR (50),
	saleCurrencyId VARCHAR (50),
	status INTEGER
)