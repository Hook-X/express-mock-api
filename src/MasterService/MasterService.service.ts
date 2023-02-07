import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { IMasterServiceController } from './MasterService.types';
import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

@injectable()
export class MasterServiceController extends BaseController implements IMasterServiceController {
	constructor(@inject(TYPES.ILogger) private loggerService: ILogger) {
		super(loggerService);
		this.bindRoutes([{ path: '/products', method: 'get', func: this.getProducts.bind(this) }]);
	}

	public getProducts(req: Request, res: Response, next: NextFunction): void {
		const pathToFile = path.resolve() + '/json/masterProducts.json';
		fs.readFile(pathToFile, 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}
			const result = JSON.parse(data);
			console.log('D A T A Products', result, data);
			res.status(200);
			res.send(JSON.stringify(result));
		});
	}
}
