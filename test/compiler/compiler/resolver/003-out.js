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
          children: [
            {
              id: 3,
              name: 'style1',
              values: {
                y: {
                  e: function() { return 1; }
                },
              },
              children: []
            }
          ]
        },
        {
          id: 4,
          name: 'body',
          closed: true,
          children: [
            {
              id: 5,
              values: {
                x: {
                  e: function() { return this.head.style1.y; },
                  r: [
                    function() { return this.head.style1.__value('y'); },
                  ]
                },
              },
              children: []
            }
          ]
        },
      ]
    }
  ]
})
