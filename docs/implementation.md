# Implementation

Code is organized in five main level modules:

* `cli/`
* `compiler/`
* `html/`
* `runtime/`
* `server/`

## cli/

Domaze ships with a CLI utility which provides a development server and lets users statically compile augmented HTML pages.

TBD

## compiler/

Domaze compiles augmented HTML to standard HTML + runtimeJS + generated JS.

### Sources

* `compiler.ts`: defines the **Compiler** class, main entry point to the compiler
  * keeps an instance of **Preprocessor** for HTML-level parsing
  * performs a chain of transformations using other modules in this sequence:
    * `loader.ts`
    * `validator.ts`
    * `qualifier.ts`
    * `resolver.ts`
    * `comptime.ts`
    * `treeshaker.ts`
    * `generator.ts`
* `const.ts`: compiler-wide constants
* `service.ts`: implements the compilation service for the CLI and the Server

## html/

Domaze needs a specific HTML parser for its source files, with support for dynamic expressions. In addition it also needs a lightweight server-side implementation of the DOM for SSR and compile time execution.

### Sources

* `dom.ts`: defines the subset of the DOM which is supported for SSR
* `parser.ts`: custom HTML parser
* `preprocessor.ts`: adds support for `<:include>` directive and defines the **Preprocessor** class, main entry point to the parser
* `server-dom.ts`: lightweight server-side DOM used for compilation and SSR

## runtime/

Implements the reactive runtime, used at compile time (compiler), delivery time (server), and runtime (client). In the first two cases, it works with the server DOM, in the latter it works with the browser DOM.

### Sources

* `const.ts`: runtime-wide constants
* `context.ts`: reactive context (one per application)
* `global.ts`: global scope for the context (one per application)
* `scope.ts`: visibility scope in the application tree; it only defines interfaces and has the following concrete implementations:
  * `scopes/base.ts`
  * `scopes/foreach.ts`
  * `scopes/define.ts`
* `value.ts`: reactive value in a scope
