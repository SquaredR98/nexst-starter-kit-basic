import express, { Express } from 'express';

import { PEServer } from './PEServer';

class Application {
	/**
	 * Function to initialize the Exxpress Server
	 */
	public initialize(): void {
		const app: Express = express();
		const server: PEServer = new PEServer(app);
		server.start();
	}
}

const application: Application = new Application();
application.initialize();
