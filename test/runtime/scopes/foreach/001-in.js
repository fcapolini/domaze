({
  __id: 0, __children: [{
    __id: 1, __children: [{
      __id: 2, __children: [],
    }, {
      __id: 3,
      __children: [{
        __id: 4,
        __type: 'foreach',
        data: { e: function() { return [1, 2, 3]; } },
        __children: [{
          __id: 5,
          text_0: {
            e: function() { return this.data; },
            r: [function() { return this.__value('data'); }]
          },
        }],
      }],
    }],
  }],
})
