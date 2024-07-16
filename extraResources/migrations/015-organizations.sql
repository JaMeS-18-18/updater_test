CREATE TABLE IF NOT EXISTS organizations (
	organizationId INTEGER,
	name VARCHAR (50),
	phone VARCHAR (50)
);

ALTER TABLE cheques ADD organizationId VARCHAR(255);
ALTER TABLE cheques ADD organizationAmount VARCHAR(255);
ALTER TABLE cheques ADD organizationComment VARCHAR(255)