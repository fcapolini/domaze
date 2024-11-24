# core.ts

Implements a reactive context where a tree of visibility scopes host reactive values.

## Value

Each reactive value is represented at runtime by a Value instance. A Value:

* knowns its Scope
* has a function (of type ValueExp) to evaluate its current value
* has an array of functions (of type ValueDep) to look up the other values it depends on, if any

These functions must be classic functions (rather than arrow functions) and are called with `this` bound to the Value's Scope.

### Methods

TBD

### Example

```js
const v1 = new Value(scope, {
  exp: function() { return 1; }
});

const v2 = new Value(scope, {
  exp: function() { return this.v1 + 2; },
  deps: [
    function() { return this.$value('v1'); }
  ]
});
```

The Scope exposes its Values via a proxy object (more on that later) so that `this.v1` returns v1's current value. It also exposes the `$value()` function which returns the Value object by name.

> NOTE: Value names should be valid JS identifiers **not including a '$' sign** (it's reserved to implementation details)

In the example above, `v2` depends on `v1`. Should `v1` ever change its current value, `v2`'s expression whould be automatically re-evaluated to update its own current value in turn.

## Scope

Scopes:

* can form trees defining nested visibility scopes for the Values they contain
* expose their values using a proxy object which hides their implementation

### Methods

TBD

### Example

TBD

## Global

A subclass of Scope used as root of a scope tree. It's used to expose a controlled set of globally visible properties.

## Context

A Context:

* represent the core of a reactive app
* has a tree of Scopes rooted in a Global

### Methods

TBD

### Example

TBD
