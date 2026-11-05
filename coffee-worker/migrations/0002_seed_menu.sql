-- The 4 coffees that used to be hardcoded in src/index.js.
INSERT INTO menu_items (id, name, description, category, price_cents, image_url) VALUES
	(1, 'Caffe Latte', 'Espresso softened with velvety steamed milk.', 'Hot coffee', 450, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=200&q=80'),
	(2, 'Iced Americano', 'Espresso, cool water, and a little room to unwind.', 'Iced coffee', 350, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=200&q=80'),
	(3, 'Cappuccino', 'Rich espresso beneath a light, airy milk foam.', 'Hot coffee', 450, 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=200&q=80'),
	(4, 'Matcha Latte', 'Earthy matcha, gently whisked with steamed milk.', 'Non-coffee', 500, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=200&q=80');
