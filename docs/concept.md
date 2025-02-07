# Concept

## What it is

Domaze is a reactive web framework. It serves the same purpose as [React](https://react.dev), [Angular](https://angular.dev), [Vue](https://vuejs.org) and [Svelte](https://svelte.dev), hereby referred to as "classic" reactive frameworks (or libraries).

Rather than being JavaScript-centric, though, Domaze is HTML-centric. Writing Domaze code means writing pages in *augmented HTML*. These page can then be compiled to standard HTML or served as they are with Domaze's included server.

## Why it exists

The approachability of the original Web and its HTML markup was crucial for its success. By turning web publishing into software development, "classic" frameworks make it complex and obscure to the uninitiated.

This makes web development [unduly complex](https://www.smashingmagazine.com/2024/02/web-development-getting-too-complex/). Domaze tries to be radically simpler and just as capable for most projects by reinstating HTML, rather than JavaScript, at the center of modern web development.

## How it works

Domaze augments standard HTML with just three simple additions:

* `:`-prefixed attributes for declaring *logic values*
* `${...}` blocks to declare *reactive expressions*
* `<:...>` tags to use *directives*.

Augmented HTML is compiled into standard HTML which includes some generated JavaScript to implement its intended behavior.

### Logic Values

In Domaze source pages you can add logic values to any tag using `:`-prefixed attributes, for example:

```html
<div :user="Joe"/>
```

The `div` is given a value named `user` and initialized with the string `"Joe"`. This attribute won't appear in compiled HTML. At runtime, the `div` will have an associated object containing the `user` value.

> 👉 in Domaze pages, all tags can be self closed. Generated HTML will always be standards compliant.

[learn more about Logic Values]()

### Reactive Expressions

`${...}` clauses, containing JavaScript expressions, can be used everywhere in attributes and texts, for example:

```html
<div :greeting="Hi" :user="Joe">
  ${greeting} ${user}!
</div>
```

will produce at runtime this output:

```html
<div>
  Hi Joe!
</div>
```

These expressions are reactive, meaning they automatically reflect changes in the values they reference. This example:

```html
<button :count=${0} :on-click=${() => count++}>
  Count: ${count}
</button>
```

will initially display "Count: 0" and it will then display "Count: 1", "Count: 2" and so on when the user clicks the button.

> 👉 we chose the classic `${...}` syntax, rather than [JSX](https://react.dev/learn/writing-markup-with-jsx)'s `{...}`, because the former works well with inlined CSS, whereas the latter conflicts with CSS syntax.

[learn more about Reactive Expressions]()

### Directives

TBD

* <:include>
* <:foreach>
* <:define>

[learn more about Directives]()

## How to check it out

>  👉 You'll need to have [Node.js](https://nodejs.org) installed

### Quick start

1. install Domaze globally with `npm i -g domaze`

2. create a `www` directory containing this `index.html` file:

   ```html
   <html>
   <body>
     <button :count=${0} :on-click=${() => count++}>
     	Count: ${count}
   	</button>
   </body>
   </html>
   ```

3. start a development server with `domaze serve www` and open [http://localhost:3000](http://localhost:3000).

This is all it takes to see Domaze at work. Feel free to try out a few [examples]() and play with them.

### Real-world projects

For real-world projects, Domaze can be added as a dependency with `npm i domaze`. The package already contains TypeScript type definitions. Depending on each project's needs, its included HTTP server can be used, its [Express.js](https://expressjs.com) middleware can be included in your own server, or Domaze pages can be compiled to standard HTML beforehand.

[learn more about using Domaze in you projects]()

