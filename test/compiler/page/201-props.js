({
  root: {
    id: 0,
    name: 'page',
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
            exp: function () { return 'hi'; }
          },
          text$0: {
            exp: function () { return this.v; },
            deps: [
              function () { return this.__value__('v'); }
            ]
          }
        }
      }
    ]
  }
})
