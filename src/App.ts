import express, { Express } from 'express';
import { UsersController } from './users/users.controller';
import { Server } from 'http';
import 'reflect-metadata';
import { inject, injectable } from 'inversify';
import { TYPES } from './types';
import { ILogger } from './logger/logger.interface';
import { IExceptionFilter } from './errors/exeption.filter.interface';
import cors from 'cors';
import { EsiaController } from './esia/esia.controller';
import { json } from 'body-parser';
import { MasterServiceController } from './MasterService/MasterService.service';
import fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import path from 'path';

@injectable()
export class App {
	public app: Express;
	public serverHttp: Server;
	public serverHttps: Server;
	public port: number;
	public portHttps: number;

	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UserController) private userController: UsersController,
		@inject(TYPES.IExceptionFilter) private exceptionFilter: IExceptionFilter,
		@inject(TYPES.EsiaController) private esiaController: EsiaController,
		@inject(TYPES.MasterServiceController) private masterServiceController: MasterServiceController,
	) {
		const pathToCert = path.resolve() + '/ssl/cert.crt';
		const pathToKey = path.resolve() + '/ssl/key.key';
		const pathToRoot = path.resolve() + '/ssl/root.crt';
		const pathToBetween = path.resolve() + '/ssl/between.crt';

		const certificate = fs.readFileSync(pathToCert, 'utf8');
		const privateKey = fs.readFileSync(pathToKey, 'utf8');
		const rootSert = fs.readFileSync(pathToRoot, 'utf8');
		const between = fs.readFileSync(pathToBetween, 'utf8');

		this.app = express();

		this.port = 8080;
		this.portHttps = 8443;

		this.serverHttp = http.createServer(this.app);
		this.serverHttps = https.createServer(
			{
				key: privateKey,
				cert: certificate,
                ca: [
                    rootSert, between
                ]
			},
			this.app,
		);

		this.serverHttp.listen(this.port);
		this.serverHttps.listen(this.portHttps);
		this.useStatic.bind(this);
	}

	public useStatic(): void {
		this.app.use(cors());
		this.app.use(function (req, res, next) {
			console.log('%c++ ==========REQ HEADERS 2', 'background:lime');
			next();
		});
		this.app.use(express.static('public'));
	}

	public useMiddleware(): void {
		this.app.use(json());
	}

	public useRouters(): void {
		this.app.use('/master', this.masterServiceController.router);
		this.app.use('/esia', this.esiaController.router);
		this.app.use('/users', this.userController.router);
	}

	public useExceptionFilter(): void {
		this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
	}

	public async init(): Promise<void> {
		this.useStatic();
		this.useMiddleware();
		this.useRouters();
		this.useExceptionFilter();
		this.logger.log(`Сервер запущен на http://localhost:${this.port}`);
	}
}
