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
        children: [
          {
            id: 3,
            type: 'foreach',
            values: {
              item: {
                exp: function () { return ['a', 'b', 'c']; }
              }
            },
            children: [
              {
                id: 4,
                values: {
                  item: {
                    exp: function () { return ''; }
                  },
                  text$0: {
                    exp: function () { return this.item; },
                    deps: [
                      function () { return this.__value__('item'); }
                    ]
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
})
