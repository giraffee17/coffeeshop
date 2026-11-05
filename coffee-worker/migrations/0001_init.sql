-- Menu items shown on the coffee page.
-- Prices are stored in cents (450 = $4.50) so we never get rounding errors.
CREATE TABLE menu_items (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	category TEXT,
	price_cents INTEGER NOT NULL,
	image_url TEXT,
	image_key TEXT,
	active INTEGER NOT NULL DEFAULT 1
);

-- One row per customer order. Each order points at one menu item.
CREATE TABLE orders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	item_id INTEGER NOT NULL REFERENCES menu_items(id),
	status TEXT NOT NULL DEFAULT 'received',
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
