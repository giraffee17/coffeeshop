import { DurableObject } from "cloudflare:workers";
import {Hono} from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use(
	'/api/*',
	cors({
		origin: ['http://localhost:8500'],
		allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'],
		allowMethods: ['POST', 'GET', 'PATCH', 'OPTIONS'],
		exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
		maxAge: 600,
		credentials: true,
	})
)

// Turn 450 (cents) into "$4.50", the format the frontend already shows.
const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

app.get('/api/coffees', async (c) => {
	const { results } = await c.env.DB
		.prepare('SELECT id, name, description, category, price_cents, image_url FROM menu_items WHERE active = ? ORDER BY id')
		.bind(1)
		.all();

	// Rename the database columns to the field names the frontend expects.
	const coffees = results.map((row) => ({
		id: row.id,
		name: row.name,
		price: formatPrice(row.price_cents),
		description: row.description,
		category: row.category,
		image: row.image_url,
	}));

	return c.json(coffees);
});

// ---------- Orders ----------

// The only allowed moves: each status points to the one that comes after it.
const NEXT_STATUS = {
	received: 'preparing',
	preparing: 'ready',
	ready: 'collected',
};

const ORDER_COLUMNS = 'id, item_id, status, created_at';

// Read the JSON body. Returns null if the body is missing or not valid JSON.
async function readJson(c) {
	try {
		return await c.req.json();
	} catch {
		return null;
	}
}

// URL params are always strings. Turn "12" into 12, or return null for "abc", "1.5", "-3".
function parseId(value) {
	return /^[0-9]+$/.test(value) ? Number(value) : null;
}

// Place a new order.  Body: { "itemId": 1 }
app.post('/api/orders', async (c) => {
	const body = await readJson(c);
	const itemId = body?.itemId;

	if (!Number.isInteger(itemId)) {
		return c.json({ error: 'itemId must be an integer' }, 400);
	}

	const item = await c.env.DB
		.prepare('SELECT id FROM menu_items WHERE id = ? AND active = ?')
		.bind(itemId, 1)
		.first();

	if (!item) {
		return c.json({ error: `Menu item ${itemId} not found` }, 404);
	}

	// RETURNING gives back the saved row, including the id and defaults the database filled in.
	const order = await c.env.DB
		.prepare(`INSERT INTO orders (item_id) VALUES (?) RETURNING ${ORDER_COLUMNS}`)
		.bind(itemId)
		.first();

	return c.json(order, 201);
});

// Check an order.
app.get('/api/orders/:id', async (c) => {
	const id = parseId(c.req.param('id'));
	if (id === null) {
		return c.json({ error: 'Order id must be a positive integer' }, 400);
	}

	const order = await c.env.DB
		.prepare(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`)
		.bind(id)
		.first();

	if (!order) {
		return c.json({ error: `Order ${id} not found` }, 404);
	}

	return c.json(order);
});

// Move an order to its next status.  Body: { "expectedStatus": "received" }
// expectedStatus is the status the caller thinks the order has right now.
app.patch('/api/orders/:id/status', async (c) => {
	const id = parseId(c.req.param('id'));
	if (id === null) {
		return c.json({ error: 'Order id must be a positive integer' }, 400);
	}

	const body = await readJson(c);
	const expectedStatus = body?.expectedStatus;

	if (typeof expectedStatus !== 'string' || !Object.hasOwn(NEXT_STATUS, expectedStatus)) {
		return c.json({
			error: `expectedStatus must be one of: ${Object.keys(NEXT_STATUS).join(', ')}`,
		}, 400);
	}

	const nextStatus = NEXT_STATUS[expectedStatus];

	// Only updates if the order still has the status the caller expected.
	// If someone else already moved it, no row matches and we get null back.
	const updated = await c.env.DB
		.prepare(`UPDATE orders SET status = ? WHERE id = ? AND status = ? RETURNING ${ORDER_COLUMNS}`)
		.bind(nextStatus, id, expectedStatus)
		.first();

	if (updated) {
		return c.json(updated);
	}

	// Nothing was updated: either the order doesn't exist, or its status changed.
	const current = await c.env.DB
		.prepare('SELECT status FROM orders WHERE id = ?')
		.bind(id)
		.first();

	if (!current) {
		return c.json({ error: `Order ${id} not found` }, 404);
	}

	return c.json({
		error: `Order ${id} is '${current.status}', not '${expectedStatus}'`,
		currentStatus: current.status,
	}, 409);
});

app.post('/api/coffees/image', (c) => {
	return c.json({ message: "Image uploaded successfully" });
});
export default app;


/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/**
 * Env provides a mechanism to reference bindings declared in wrangler.jsonc within JavaScript
 *
 * @typedef {Object} Env
 * @property {DurableObjectNamespace} MY_DURABLE_OBJECT - The Durable Object namespace binding
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param {DurableObjectState} ctx - The interface for interacting with Durable Object state
	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx, env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param {string} name - The name provided to a Durable Object instance from a Worker
	 * @returns {Promise<string>} The greeting to be sent back to the Worker
	 */
	async sayHello(name) {
		return `Hello, ${name}!`;
	}
}

// export default {
// 	/**
// 	 * This is the standard fetch handler for a Cloudflare Worker
// 	 *
// 	 * @param {Request} request - The request submitted to the Worker from the client
// 	 * @param {Env} env - The interface to reference bindings declared in wrangler.jsonc
// 	 * @param {ExecutionContext} ctx - The execution context of the Worker
// 	 * @returns {Promise<Response>} The response to be sent back to the client
// 	 */
// 	async fetch(request, env, ctx) {
// 		// Create a stub to open a communication channel with the Durable Object
// 		// instance named "foo".
// 		//
// 		// Requests from all Workers to the Durable Object instance named "foo"
// 		// will go to a single remote Durable Object instance.
// 		const stub = env.MY_DURABLE_OBJECT.getByName("foo");

// 		// Call the `sayHello()` RPC method on the stub to invoke the method on
// 		// the remote Durable Object instance.
// 		const greeting = await stub.sayHello("world");

// 		return new Response(greeting);
// 	}
// };
