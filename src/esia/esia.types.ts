import { NextFunction, Request, Response } from 'express';

export interface IEsiaController {
	firstRequestStatus(req: Request, res: Response, next: NextFunction): void;
	secondRequestStatus(req: Request, res: Response, next: NextFunction): void;
}
