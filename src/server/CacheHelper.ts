function memoize(target: any, prop: string, descriptor: PropertyDescriptor) {
  let original = descriptor.get;

  descriptor.get = function (...args: any[]) {
    // TODO: Add functionality to allow for memoization
    //  to be skipped if a certain argument is passed
    const privateProp = `__memoized_${prop}`;

    if (!this.hasOwnProperty(privateProp)) {
      Object.defineProperty(this, privateProp, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: original.apply(this, args),
      });
    }

    return this[privateProp];
  };
}

export { memoize };
