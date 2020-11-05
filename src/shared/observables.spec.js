import { Observable, Mapper, Rx } from './observables.js'

// Sample functions
const mult = x => y => x * y
const double = mult(2)

// Create observable and emit sample values.
// Timeout for better code organization
const observable = new Observable()
setTimeout(() => {
  observable.emit(10)
  observable.emit(1)
  observable.emit(-2)
  observable.emit(3)
  observable.emit(4)
}, 100)

//////////////////////
//  Usage examples  //
//////////////////////

// Test pipe method with Rx.map and double function
const doubler = observable.pipe(Rx.map(double))

// Test pipe method with Mapper
const trippler = observable.pipe(new Mapper(mult(3)))

// Test observable with filter
observable.pipe(Rx.filter(x => x >= 0)).subscribe(console.log)

// Test observable with reject
observable.pipe(Rx.reject(x => x < 0)).subscribe(console.log)

// Test composite pipe
const doubleAbs = observable.pipe(
  Rx.map(x => x * 2),
  Rx.map(Math.abs),
  Rx.map(x => x + 10),
  Rx.map(x => `The number is: ${x}`)
)

// Subscribe to each observable with console.log
observable.subscribe(console.log)
doubler.subscribe(console.log)
trippler.subscribe(console.log)
doubleAbs.subscribe(console.log)
