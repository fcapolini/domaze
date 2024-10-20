({
  root: {
    id: 0,
    name: 'page',
    values: {
      x: { exp: function () { return 1; } },
      v: { exp: function () { return 2; } }
    },
    children: [
      {
        id: 1,
        name: 'head'
      },
      {
        id: 2,
        name: 'body',
        values: {
          v: {
            exp: function () { return this.x + this.__parent__.v; },
            deps: [
              function () { return this.__value__('x'); },
              function () { return this.__parent__.__value__('v'); },
            ]
          }
        }
      }
    ]
  }
})
