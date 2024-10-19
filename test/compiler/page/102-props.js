({
  root: {
    id: 0,
    name: 'page',
    values: {
      v: {
        exp: function () {
          return () => {
            let x = 1;
            return x;
          }
        }
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
