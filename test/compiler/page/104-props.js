({
  root: {
    id: 0,
    name: 'page',
    values: {
      y: {
        exp: function () { return 2; }
      },
      v: {
        exp: function () {
          return () => {
            let x = 1;
            return this.y;
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
