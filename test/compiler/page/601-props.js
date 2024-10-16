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
            dummy: {
              exp: function() { return this.console.log('hi'); },
            },
          },
          children: []
        }
      ]
    }
  ]
})
