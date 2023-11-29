/** Chaining 2 functions. Basically, approximation to the real pipe function
 *  @alias   accumulator
 *  @example
 *  chain(console.log, double)
 */
export const chain = (f, g) => x => f(g(x))

/** Pipes values through functions
 *  @example
 *  pipe(double, double, tap(console.log))(3);
 */
export const pipe = (...fs) => x => fs.reduce((acc, f) => f(acc), x)

/** Executes function but returns the input value
 *  @alias   do
 *  @example
 *  pipe(tap(console.log), x => x *2, tap(console.log))(2)
 */
export const tap = f => x => {
  f(x)
  return x
}

/** Pipe values through functions
 *  @example
 *  thrush("Boo")(console.log);
 */
export const thrush = x => f => f(x)

/** Constructs filter from the function
 *  @example
 *  filter(console.log)("Boo")
 *  const positive = filter( x => x > 0)
 *  console.log([1, -2, 3, -4].filter(positive))
 */
export const filter = f => x => f(x)

/** Reverse filter */
export const not = f => x => !f(x)
