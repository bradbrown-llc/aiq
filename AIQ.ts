// takes an array named queue, then creates a promise and the functions push and unshift
// the promise is resolved after the provided push or unshift functions are used 
function foo<T>(queue:Array<T|symbol>) {
    const { promise, resolve } = Promise.withResolvers<void>()
    const push = (x:T|symbol) => { const len = queue.push(x); resolve(); return len }
    const unshift = (x:T|symbol) => { const len = queue.unshift(x); resolve(); return len }
    return [promise, push, unshift] as const
}

/**
 * An asynchronous iterable queue.
 */
export class AIQ<T> implements AsyncIterator<T> {

    push:(x:T|symbol)=>number
    unshift:(x:T|symbol)=>number
    terminator:symbol
    #promise:Promise<void>
    #queue:Array<T|symbol>
    limit?:number
    
    constructor(limit?:number) {
        this.#queue = []
        ;[this.#promise, this.push, this.unshift] = foo(this.#queue)
        if (limit) this.limit = limit
        this.terminator = Symbol()
    }

    async next():Promise<IteratorResult<T>> {
        if (!this.#queue.length) await this.#promise
        ;[this.#promise, this.push, this.unshift] = foo(this.#queue)
        const value = this.#queue.shift() as T|symbol
        if (value === this.terminator) { return { done: true, value: null } }
        if (this.limit === 0) { return { done: true, value: null } }
        if (this.limit) { this.limit--; if (!this.limit) this.push(this.terminator) }
        return { value } as { value:T }
    }
    
    [Symbol.asyncIterator]() { return this }
    
}