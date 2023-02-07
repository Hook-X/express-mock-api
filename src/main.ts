import { App } from './App';
import { Container, ContainerModule, interfaces } from 'inversify';
import { ILogger } from './logger/logger.interface';
import { TYPES } from './types';
import { LoggerService } from './logger/logger.service';
import { IExceptionFilter } from './errors/exeption.filter.interface';
import { ExceptionFilter } from './errors/exceptionFilter';
import { UsersController } from './users/users.controller';
import { IUserController } from './users';
import { IEsiaController } from './esia/esia.types';
import { EsiaController } from './esia/esia.controller';
import { IMasterServiceController } from './MasterService';
import { MasterServiceController } from './MasterService/MasterService.service';

export interface IBootstrapReturn {
	app: App;
	appContainer: Container;
}

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
	bind<ILogger>(TYPES.ILogger).to(LoggerService);
	bind<IExceptionFilter>(TYPES.IExceptionFilter).to(ExceptionFilter);
	bind<IUserController>(TYPES.UserController).to(UsersController);
	bind<IEsiaController>(TYPES.EsiaController).to(EsiaController);
	bind<IMasterServiceController>(TYPES.MasterServiceController).to(MasterServiceController);
	bind<App>(TYPES.Application).to(App);
});

function bootstrap(): IBootstrapReturn {
	const appContainer = new Container();
	appContainer.load(appBindings);
	const app = appContainer.get<App>(TYPES.Application);
	app.init().then();
	return { appContainer, app };
}

export const { appContainer, app } = bootstrap();

// const appContainer = new Container();
//
// appContainer.bind<ILogger>(TYPES.ILogger).to(LoggerService);
// appContainer.bind<IExceptionFilter>(TYPES.IExceptionFilter).to(ExceptionFilter);
// appContainer.bind<UsersController>(TYPES.UserController).to(UsersController);
// appContainer.bind<App>(TYPES.Application).to(App);
//
// const app = appContainer.get<App>(TYPES.Application);
// app.init().then();
//
// export { app, appContainer };
