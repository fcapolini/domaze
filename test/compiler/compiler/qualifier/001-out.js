({
  id: 0,
  children: [
    {
      id: 1,
      name: 'page',
      children: [
        {
          id: 2,
          name: 'head',
          children: []
        },
        {
          id: 3,
          name: 'body',
          values: {
            x: {
              e: function() { return this.y; }
            },
            y: {
              e: function() { return 1; }
            },
          },
          children: []
        },
      ]
    }
  ]
})
