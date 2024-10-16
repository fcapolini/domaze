({
  root: [
    {
      id: 0,
      name: 'page',
      values: {
        y: {
          exp: function() { return 2; }
        },
        v: {
          exp: function() { return (y) => {
            let x = 1;
            return y;
          } }
        },
      },
      children: [
        {
          id: 1,
          name: 'head',
          children: []
        },
        {
          id: 2,
          name: 'body',
          children: []
        }
      ]
    }
  ]
})
