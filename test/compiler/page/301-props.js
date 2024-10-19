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
        name: 'app',
        values: {
          $name: { exp: function () { return 'app'; } }
        }
      }
    ]
  }
})
