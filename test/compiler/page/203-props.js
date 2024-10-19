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
            values: {
              v: {
                exp: function () { return 'hi'; }
              },
              t$0: {
                exp: function () { return this.v; },
                deps: [
                  function () { return this.$value('v'); }
                ]
              }
            },
            children: []
          }
        ]
      }
    ]
  }
})
