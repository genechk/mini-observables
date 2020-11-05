import { not, thrush } from './chaining.js'

/**  Attempt in Recreation of Observable from rx.js
 *   using basic JS and someone elses knowledge of
 *   functional programming
 */
export class Observable {
  constructor() {
    this.subscribers = []
  }

  subscribe(cb) {
    this.subscribers.push(cb)
  }

  emit(value) {
    this.subscribers.map(thrush(value))
  }

  pipe(...os) {
    // this -> o1 -> o2 -> o3 -> ...
    return os.reduce((acc, o) => {
      acc.subscribe(o.emit.bind(o))
      return o
    }, this)

    /** Initial implementation
     *  this.subscribe((x) => o.emit(x));
     *  return o;
     */
  }
}

/** Special interface of observable that handles map-like use-cases */
export class Mapper {
  constructor(f) {
    this.observable = new Observable()
    this.f = f
  }

  subscribe(cb) {
    this.observable.subscribe(cb)
  }

  emit(value) {
    this.observable.emit(this.f(value))
  }
}

/** Special interface of observable that handles filter-like use-cases */
export class Filter {
  constructor(p) {
    this.observable = new Observable()
    this.p = p
  }
  subscribe(cb) {
    this.observable.subscribe(cb)
  }
  emit(x) {
    if (this.p(x)) {
      this.observable.emit(x)
    }
  }
}

/** Rx-like object
 *  (p stands for Predicate)
 */
export const Rx = {
  map: f => new Mapper(f),
  filter: p => new Filter(p),
  reject: p => new Filter(not(p)),
}
