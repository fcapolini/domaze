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
          name: 'app',
          values: {
            $name: { exp: function() { return 'app'; } }
          },
          children: []
        }
      ]
    }
  ]
})
