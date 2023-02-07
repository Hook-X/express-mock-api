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

@injectable()
export class App {
	public app: Express;
	public server: Server;
	public port: number;
	constructor(
		@inject(TYPES.ILogger) private logger: ILogger,
		@inject(TYPES.UserController) private userController: UsersController,
		@inject(TYPES.IExceptionFilter) private exceptionFilter: IExceptionFilter,
		@inject(TYPES.EsiaController) private esiaController: EsiaController,
		@inject(TYPES.MasterServiceController) private masterServiceController: MasterServiceController,
	) {
		this.app = express();
		this.port = 5555;
		this.server = this.app.listen(this.port);
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
