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
          values: {
            y: {
              e: function() { return 1; }
            },
          },
          children: []
        },
        {
          id: 3,
          name: 'body',
          values: {
            x: {
              e: function() { return this.head.y; },
              r: [
                function() { return this.head.__value('y'); },
              ]
            },
          },
          children: []
        },
      ]
    }
  ]
})
