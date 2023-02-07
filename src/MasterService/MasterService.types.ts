import { NextFunction, Request, Response } from 'express';

export interface IMasterServiceController {
	getProducts(req: Request, res: Response, next: NextFunction): void;
}
