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
          text$0: {
            exp: function () { return this.v; },
            deps: [
              function () { return this.__value__('v'); }
            ]
          },
        }
      }
    ]
  }
})
