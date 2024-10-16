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
          exp: function() { return function (y) {
            const f = () => y;
            return f();
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
