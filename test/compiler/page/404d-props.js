({
  root: {
    id: 0,
    name: 'page',
    values: {
      x: { exp: function () { return 1; } }
    },
    children: [
      {
        id: 1,
        name: 'head',
        values: {
          y: { exp: function () { return 2; } }
        }
      },
      {
        id: 2,
        name: 'body',
        values: {
          v: {
            exp: function () { return this.x + this.head[0]; },
            deps: [
              function () { return this.__value__('x'); }
            ]
          }
        }
      }
    ]
  }
})
