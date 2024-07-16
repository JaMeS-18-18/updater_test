ALTER TABLE products ADD promotionProduct INTEGER default 0;
ALTER TABLE products ADD promotionProductName VARCHAR(100);
ALTER TABLE products ADD promotionProductBarcode VARCHAR(100);
ALTER TABLE products ADD promotionProductQuantity VARCHAR(100);
ALTER TABLE products ADD promotionQuantity VARCHAR(100);
ALTER TABLE products ADD productBox INTEGER default 0;
ALTER TABLE products ADD productBoxItemList TEXT