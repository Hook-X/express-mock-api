import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error.class';
import { IEsiaController } from './esia.types';
import path from 'path';
import fs from 'fs';
import {PhoneConfirmDto} from "../DTO/phoneConfirmDto.dto";

export enum DigitalProfileRequestStatusType {
	Success = 0,
	ErrorServer = 1,
}

export enum DigitalProfileRequestStatus {
	AUTH_IN_PROGRESS = 'AUTH_IN_PROGRESS',
	ERROR = 'ERROR',
	LOADING_DATA = 'LOADING_DATA',
	DATA_IS_REQUESTED = 'DATA_IS_REQUESTED',
	PROCESSING_DATA = 'PROCESSING_DATA',
	DONE = 'DONE',
	NOT_EXISTS = 'NOT_EXISTS',
	UPDATED = 'UPDATED',
}

export enum DigitalProfileUuidType {
	Success = 0,
	ErrorServer1 = 1,
	ErrorServer2 = 2,
	ErrorServer3 = 3,
	ErrorServer4 = 4,
	PhoneIsNotSent = 60000,
	PhoneIsNotCorrect = 60001,
}

const UUID_RESPONSE = {
	status: DigitalProfileUuidType.Success,
	message: 'Тут сообщение',
	data: {
		txId: 'F359F9E5-5402-4444-9DC5-6FE4439FFAA4',
		uuid: 'BF864BCB-EDF5-42EB-A8CB-3B9EABA9BD00',
		url: '',
		state: '',
		delay: 3000,
		maxAttempts: 3,
	},
};

const URL_RESPONSE = {
	status: 0,
	message: null,
	data: {
		url: 'https://esia.gosuslugi.ru/aas/oauth2/ac?access_type=online&permissions=W3sicHVycG9zZXMiOlt7InN5c25hbWUiOiJVUERfQ1VTVE9NRVJfSU5GIn0seyJzeXNuYW1lIjoiUkVHX1FVRVNUSU9OTkFJUkUifSx7InN5c25hbWUiOiJGSU5fU0VSVklDRVNfT0ZGRVIifSx7InN5c25hbWUiOiJDUkVESVQifV0sInN5c25hbWUiOiJDUkVESVQiLCJleHBpcmUiOjI2Mjk3NDYwLCJzY29wZXMiOlt7InN5c25hbWUiOiJmdWxsbmFtZSJ9LHsic3lzbmFtZSI6ImdlbmRlciJ9LHsic3lzbmFtZSI6ImJpcnRoZGF0ZSJ9LHsic3lzbmFtZSI6InNuaWxzIn0seyJzeXNuYW1lIjoiaW5uIn0seyJzeXNuYW1lIjoiaWRfZG9jIn0seyJzeXNuYW1lIjoiYmlydGhwbGFjZSJ9LHsic3lzbmFtZSI6ImFkZHJlc3NlcyJ9LHsic3lzbmFtZSI6InZlaGljbGVzIn0seyJzeXNuYW1lIjoibW9iaWxlIn0seyJzeXNuYW1lIjoiZW1haWwifSx7InN5c25hbWUiOiJkcml2ZXJzX2xpY2VuY2VfZG9jIn0seyJzeXNuYW1lIjoiZm9yZWlnbl9wYXNzcG9ydF9kb2MifSx7InN5c25hbWUiOiJpbHNfZG9jIn0seyJzeXNuYW1lIjoiaGlzdG9yeV9wYXNzcG9ydF9kb2MifSx7InN5c25hbWUiOiJwYXRlcm5pdHlfY2VydF9kb2MifSx7InN5c25hbWUiOiJjaGFuZ2VfZnVsbG5hbWVfY2VydF9kb2MifSx7InN5c25hbWUiOiJkaXZvcmNlX2NlcnRfZG9jIn0seyJzeXNuYW1lIjoibWFycmlhZ2VfY2VydF9kb2MifSx7InN5c25hbWUiOiJiaXJ0aF9jZXJ0X2RvYyJ9LHsic3lzbmFtZSI6Im5kZmxfcGVyc29uIn0seyJzeXNuYW1lIjoicGVuc2lvbl9yZWZlcmVuY2UifSx7InN5c25hbWUiOiJlbGVjdHJvbmljX3dvcmtib29rIn0seyJzeXNuYW1lIjoiZmFtaWx5X2Fzc2V0c19iYWxhbmNlIn0seyJzeXNuYW1lIjoicHJlX3JldGlyZW1lbnRfYWdlIn0seyJzeXNuYW1lIjoicGF5bWVudHNfZWdpc3NvIn0seyJzeXNuYW1lIjoidmVoaWNsZV9yZWdfY2VydF9kb2MifSx7InN5c25hbWUiOiJwYXlvdXRfaW5jb21lIn1dLCJhY3Rpb25zIjpbeyJzeXNuYW1lIjoiQUxMX0FDVElPTlNfVE9fREFUQSJ9XX1d&scope=openid&response_type=code&client_secret=MIIKEQYJKoZIhvcNAQcCoIIKAjCCCf4CAQExDjAMBggqhQMHAQECAgUAMAsGCSqGSIb3DQEHAaCCCC8wgggrMIIH1qADAgECAhBAYBxQk77EDA4JWRphZXfbMAwGCCqFAwcBAQMCBQAwggEoMQswCQYDVQQGEwJSVTEtMCsGA1UECAwkNzgg0LMuINCh0LDQvdC60YIt0J_QtdGC0LXRgNCx0YPRgNCzMSYwJAYDVQQHDB3QodCw0L3QutGCLdCf0LXRgtC10YDQsdGD0YDQszFGMEQGA1UECQw90J_QtdGA0LXRg9C70L7QuiDQlNC10LPRgtGP0YDQvdGL0LksINC00L7QvCAxMSwg0LvQuNGC0LXRgCDQkDEhMB8GA1UECgwY0JHQsNC90Log0JLQotCRICjQn9CQ0J4pMSEwHwYDVQQDDBjQkdCw0L3QuiDQktCi0JEgKNCf0JDQnikxGDAWBgUqhQNkARINMTAyNzczOTYwOTM5MTEaMBgGCCqFAwOBAwEBEgwwMDc3MDIwNzAxMzkwHhcNMjExMDEyMTE1NjExWhcNMjIxMDEyMTE1NjExWjCCASMxCzAJBgNVBAYTAlJVMS0wKwYDVQQIDCQ3OCDQsy4g0KHQsNC90LrRgi3Qn9C10YLQtdGA0LHRg9GA0LMxJjAkBgNVBAcMHdCh0LDQvdC60YIt0J_QtdGC0LXRgNCx0YPRgNCzMUYwRAYDVQQJDD3Qn9C10YDQtdGD0LvQvtC6INCU0LXQs9GC0Y_RgNC90YvQuSwg0LTQvtC8IDExLCDQu9C40YLQtdGAINCQMSEwHwYDVQQKDBjQkdCQ0J3QmiDQktCi0JEgKNCf0JDQnikxITAfBgNVBAMMGNCR0JDQndCaINCS0KLQkSAo0J_QkNCeKTEYMBYGBSqFA2QBEg0xMDI3NzM5NjA5MzkxMRUwEwYFKoUDZAQSCjc3MDIwNzAxMzkwZjAfBggqhQMHAQEBATATBgcqhQMCAiQABggqhQMHAQECAgNDAARAKzrKU0Ex7X-RAQq-yt8Z3PaZyCwS5NUv3u87P2HGcL3v5BYD71XiYEljZZTAqc3VCog6g23hGMI5_B3tJpeZV6OCBNIwggTOMDYGA1UdEQQvMC2gKwYDVQQNoCQMItCh0Jcg4oSWIDIxLzQ2MzE3MCDQvtGCIDA4LjEwLjIwMjEwDgYDVR0PAQH_BAQDAgP4MAwGA1UdEwEB_wQCMAAwDAYFKoUDZHIEAwIBATAmBgNVHSUEHzAdBgcqhQMCAiIGBggrBgEFBQcDAgYIKwYBBQUHAwQwHQYDVR0gBBYwFDAIBgYqhQNkcQEwCAYGKoUDZHECMD0GBSqFA2RvBDQMMtCh0JrQl9CYICLQmtGA0LjQv9GC0L7Qn9GA0L4gQ1NQIiDQstC10YDRgdC40Y8gNC4wMCwGCSsGAQQB0AQEAwQfMB0GCSsGAQQB0AQFAQQQNVRVMDQzWldYVzNKVU83RDArBgNVHRAEJDAigA8yMDIxMTAxMjExNTYxMVqBDzIwMjIxMDEyMTExMzEwWjAdBgNVHQ4EFgQU3iqe-oltf-r3lybdQeJa1cy11PMwbQYIKwYBBQUHAQEEYTBfMF0GCCsGAQUFBzAChlFodHRwOi8vcGtpLnZ0Yi5ydS9wa2kvZ29zdC9haWEvdnRicWNhMkEwNkRCNDdERTJGMDY3Mjg0REY2N0Y1QTU4MTcyMkJDODk0MzYzMC5jZXIwYwYDVR0fBFwwWjBYoFagVIZSaHR0cDovL3BraS52dGIucnUvcGtpL2dvc3QvY2RwL3Z0YnFjcmwyQTA2REI0N0RFMkYwNjcyODRERjY3RjVBNTgxNzIyQkM4OTQzNjMwLmNybDCBqwYFKoUDZHAEgaEwgZ4MJ9Ca0YDQuNC_0YLQvtCf0YDQviBDU1Ag0LLQtdGA0YHQuNGPIDQuMAwl0JDQn9CaICLQo9CmINCS0KLQkSIg0LLQtdGA0YHQuNGPIDMuMQwd0KHQpC8xMjQtMzk2OSDQvtGCIDE1LjAxLjIwMjEMLdCh0KQvMTI4LTM3ODIg0L7RgiAxMSDQtNC10LrQsNCx0YDRjyAyMDE5INCzLjCCAV8GA1UdIwSCAVYwggFSgBQqBttH3i8GcoTfZ_WlgXIryJQ2MKGCASykggEoMIIBJDEeMBwGCSqGSIb3DQEJARYPZGl0QG1pbnN2eWF6LnJ1MQswCQYDVQQGEwJSVTEYMBYGA1UECAwPNzcg0JzQvtGB0LrQstCwMRkwFwYDVQQHDBDQsy4g0JzQvtGB0LrQstCwMS4wLAYDVQQJDCXRg9C70LjRhtCwINCi0LLQtdGA0YHQutCw0Y8sINC00L7QvCA3MSwwKgYDVQQKDCPQnNC40L3QutC-0LzRgdCy0Y_Qt9GMINCg0L7RgdGB0LjQuDEYMBYGBSqFA2QBEg0xMDQ3NzAyMDI2NzAxMRowGAYIKoUDA4EDAQESDDAwNzcxMDQ3NDM3NTEsMCoGA1UEAwwj0JzQuNC90LrQvtC80YHQstGP0LfRjCDQoNC-0YHRgdC40LiCClVzKDYAAAAABOgwgYIGA1UdEgR7MHmgIQYDVQQKoBoMGNCR0LDQvdC6INCS0KLQkSAo0J_QkNCeKYEKcGtpQHZ0Yi5ydaBIBgNVBBOgQQw_MTIzMTAwLCDQnNC-0YHQutCy0LAsINCf0YDQtdGB0L3QtdC90YHQutCw0Y8g0L3QsNCxLiwg0LTQvtC8IDEyMAwGCCqFAwcBAQMCBQADQQC19NQVFmXPpsL1EasJtMjA-pfi4V8zHMhRlh-Mqde12GZppU5jz6HmKNj4LvuCltYLHGoy-MKC-8PpFvz3vUrGMYIBpzCCAaMCAQEwggE-MIIBKDELMAkGA1UEBhMCUlUxLTArBgNVBAgMJDc4INCzLiDQodCw0L3QutGCLdCf0LXRgtC10YDQsdGD0YDQszEmMCQGA1UEBwwd0KHQsNC90LrRgi3Qn9C10YLQtdGA0LHRg9GA0LMxRjBEBgNVBAkMPdCf0LXRgNC10YPQu9C-0Log0JTQtdCz0YLRj9GA0L3Ri9C5LCDQtNC-0LwgMTEsINC70LjRgtC10YAg0JAxITAfBgNVBAoMGNCR0LDQvdC6INCS0KLQkSAo0J_QkNCeKTEhMB8GA1UEAwwY0JHQsNC90Log0JLQotCRICjQn9CQ0J4pMRgwFgYFKoUDZAESDTEwMjc3Mzk2MDkzOTExGjAYBggqhQMDgQMBARIMMDA3NzAyMDcwMTM5AhBAYBxQk77EDA4JWRphZXfbMAwGCCqFAwcBAQICBQAwDAYIKoUDBwEBAQEFAARA3yDu96LwLZUcrLD2gSxbnGl1X7xyiDfIUGImYoE4JaXT5IIytg6DLhNmSG4Bze5EJCqZjS0hG8ayiNNbnsuBtg==&state=bb9e970d-a568-4c09-a10e-21c5bb6f0605&redirect_uri=https://google.com/msa/api-gw/vtbid/vtbid-gdp-datasource/gov-gw/callback&client_id=774210&timestamp=2022.06.15%2000%3A17%3A49%20%2B0300',
		state: '2e4b2a23-9ed5-4110-940d-e0eb3d49cfc0',
		delay: null,
		maxAttempts: null,
	},
};

const token =
	'2c3503efa759d49ee1eefc2ca626d56194d7ead1f1a6c5c3d232a5a1ea3589003838363838337c32663730626135362d343863622d343563322d613435392d366137346437383866313966&types=';

@injectable()
export class EsiaController extends BaseController implements IEsiaController {
	constructor(@inject(TYPES.ILogger) private loggerService: ILogger) {
		super(loggerService);
		this.bindRoutes([
			{ path: '/FirstRequestStatus', method: 'get', func: this.firstRequestStatus.bind(this) },
			{ path: '/SecondRequestStatus', method: 'get', func: this.secondRequestStatus.bind(this) },
			{ path: '/PingStatus', method: 'post', func: this.pingMessage.bind(this) },
			{ path: '/GetUrl', method: 'get', func: this.getUrl.bind(this) },
			{ path: '/GetUuid', method: 'post', func: this.getUuid.bind(this) },
			{ path: '/M1/Registry', method: 'get', func: this.getRegistry.bind(this) },
		]);
	}

	public getUuid(req: Request<{}, {}, PhoneConfirmDto>, res: Response, next: NextFunction): void {
		console.log('%c++ ==========getUuid', 'background:lime', req.body);
		res.status(200);
		res.send(JSON.stringify(UUID_RESPONSE));
	}

	public getRegistry(req: Request, res: Response, next: NextFunction): void {

		res.status(200);
		res.send(JSON.stringify(UUID_RESPONSE));
	}

	public getUrl(req: Request, res: Response, next: NextFunction): void {
		res.status(200);
		res.send(JSON.stringify(URL_RESPONSE));
	}

	public firstRequestStatus(req: Request, res: Response, next: NextFunction): void {
		const pathToFile = path.resolve() + '/json/esia.json';
		//console.log('%c++ ==========', 'background:lime', pathToFile);
		fs.readFile(pathToFile, 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return;
			}
			const result = JSON.parse(data).first;
			//console.log('D A T A', result);
			res.status(200);
			res.send(JSON.stringify(result));
		});

		// const response = {
		// 	status: DigitalProfileRequestStatusType.Success,
		// 	message: 'Cnhjrf',
		// 	data: {
		// 		status: DigitalProfileRequestStatus.PROCESSING_DATA,
		// 		delay: 500,
		// 		maxAttempts: 6,
		// 	},
		// };
		//
		// res.status(200);
		// res.send(JSON.stringify(response));
	}

	/**
     * export interface IGetRequestStatusResponse {
      status: AgreementRequestStatusType;
      message?: string;
      data?: IGetRequestStatusResponseData;
    }
     */

	public secondRequestStatus(req: Request, res: Response, next: NextFunction): void {
		this.ok(res, 'Register');
	}

	public pingMessage(req: Request, res: Response, next: NextFunction): void {
		//console.log('%c++ ==========req', 'background:lime', req);
		this.ok(res, 'Sending');
	}
}
