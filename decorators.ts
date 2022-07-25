function Component(target: Function) {
	console.log(target); // [class User]
}

@Component
export class User {
	public id = 0;

	updateId(newId: number) {
		this.id = newId;
		return this.id;
	}
}
