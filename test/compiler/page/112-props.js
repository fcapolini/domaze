({
  root: {
    id: 0,
    name: 'page',
    values: {
      v: {
        exp: function () { return 'a'; }
      },
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
            exp: function () { return this.__parent__.v + 1; },
            deps: [
              function () { return this.__parent__.__value__('v'); }
            ]
          },
        }
      }
    ]
  }
})
