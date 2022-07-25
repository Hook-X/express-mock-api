// import 'reflect-metadata';
//
// function Injectable(key: string) {
//     return (target: Function) => {
//         Reflect.defineMetadata(key, 1, target);
//         const meta = Reflect.getMetadata(key, target);
//         console.log("%c++ =====META DATA A=====","background:lime", meta);
//     }
// }
//
// function Inject(key: string) {
//     return (target: Function) => {
//         Reflect.defineMetadata(key, 1, target);
//         const meta = Reflect.getMetadata(key, target);
//         console.log("%c++ =====META DATA A=====","background:lime", meta);
//     }
// }
//
// function Prop(target: Object, name: string) {}
//
// @Injectable('C')
// export class C {
//     @Prop prop: number;
// }
//
// @Injectable('D')
// export class D {
//     constructor(@Inject('C') c: C) {
//     }
// }
//
// /// Что было до
//
// // function Injectable(target: Function) {
// //     Reflect.defineMetadata('a', 1, target);
// //     const meta = Reflect.getMetadata('a', target);
// //     console.log("%c++ =====META DATA A=====","background:lime", meta)
// // }
// //
// // @Injectable
// // export class C {
// //     @Prop prop: number;
// // }
