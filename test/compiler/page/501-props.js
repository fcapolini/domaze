({
  root: [
    {
      id: 0,
      name: 'page',
      children: [
        {
          id: 1,
          name: 'head',
          children: []
        },
        {
          id: 2,
          name: 'body',
          values: {
            n: {
              exp: function() { return 0; },
            },
            ev$click: {
              exp: function() { return () => this.n++ },
            },
          },
          children: []
        }
      ]
    }
  ]
})
