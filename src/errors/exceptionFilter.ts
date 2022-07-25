import { LoggerService } from '../logger/logger.service';
import { NextFunction, Request, Response } from 'express';
import { IExceptionFilter } from './exeption.filter.interface';
import { HttpError } from './http-error.class';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../types';

@injectable()
export class ExceptionFilter implements IExceptionFilter {
	constructor(@inject(TYPES.ILogger) public logger: LoggerService) {
		this.logger = logger;
	}

	catch(err: Error | HttpError, req: Request, res: Response, next: NextFunction) {
		if (err instanceof HttpError) {
			this.logger.error(`[${err.context}] Ошибка ${err.statusCode} : ${err.message}`);
			res.status(500).send({ err: err.message });
		} else {
			this.logger.error(`${err.message}`);
			res.status(500).send({ err: err.message });
		}
	}
}
