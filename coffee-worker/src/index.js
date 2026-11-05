import { DurableObject } from "cloudflare:workers";
import {Hono} from "hono";
import { cors } from "hono/cors";

const app = new Hono();
app.use(
	'/api/*',
	cors({
		origin: ['http://localhost:8500'],
		allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
		allowMethods: ['POST', 'GET', 'OPTIONS'],
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
