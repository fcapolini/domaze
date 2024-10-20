({
  root: {
    id: 0,
    name: 'page',
    values: {
      x: {
        exp: function () { return 1; }
      },
      v: {
        exp: function () { return this.x + 1; },
        deps: [
          function () { return this.__value__('x'); }
        ]
      },
    },
    children: [
      {
        id: 1,
        name: 'head'
      },
      {
        id: 2,
        name: 'body'
      }
    ]
  }
})
