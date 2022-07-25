import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { NextFunction, Response, Request } from 'express';
import { HttpError } from '../errors/http-error.class';
import 'reflect-metadata';
import { IUserController } from './users.types.ts';

@injectable()
export class UsersController extends BaseController implements IUserController {
	constructor(@inject(TYPES.ILogger) private loggerService: ILogger) {
		super(loggerService);
		this.bindRoutes([
			{ path: '/register', method: 'post', func: this.register.bind(this) },
			{ path: '/login', method: 'post', func: this.login.bind(this) },
		]);
	}

	public login(req: Request, res: Response, next: NextFunction): void {
		next(new HttpError(401, 'ошибка авторизации', 'login'));
	}

	public register(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Register');
	}
}
