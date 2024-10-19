({
  root: {
    id: 0,
    name: 'page',
    values: {
      title: {
        exp: function() { return 'Title'; }
      }
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
