
export class Stack<T> extends Array<T> {

  peek(i = -1): T | undefined {
    if (i < 0) {
      i += this.length;
    }
    return i >= 0 && i < this.length ? this[i] : undefined;
  }

}

export type Observer<T> = (msg: T) => void;

export class Observable<T> {
  observers: Observer<T>[] = [];

  addObserver(o: Observer<T>): this {
    this.observers.push(o);
    return this;
  }

  notify(msg: T): this {
    this.observers.forEach(o => { try { o(msg); } catch (_) { /* nop */ } });
    return this;
  }

  clear(): this {
    this.observers.splice(0, this.observers.length);
    return this;
  }
}

export function dashToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, up) => up.toUpperCase());
}

export function camelToDash(s: string): string {
  return s.replace(/([a-z][A-Z])/g, (g) => g[0] + '-' + g[1].toLowerCase());
}

export function encodeEventName(s: string): string {
  return s.replace('.', '__DOT__').replace('-', '__DASH__');
}

export function decodeEventName(s: string): string {
  return s.replace('__DOT__', '.').replace('__DASH__', '-');
}
