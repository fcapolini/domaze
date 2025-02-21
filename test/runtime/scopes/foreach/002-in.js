({
  __id: 0,
  __children: [{
    __id: 1,
    __name: 'page',
    data: { e: function() { return [[1, 2]]; } },
    __children: [{
      __id: 2, __children: [],
    }, {
      __id: 3,
      __children: [{
        __id: 4,
        __type: 'foreach',
        data: {
          e: function() { return this.page.data; },
          r: [function() { return this.page.__value('data'); }]
        },
        __children: [{
          __id: 5,
          text_5_0: {
            e: function() { return this.data; },
            r: [function() { return this.__value('data'); }]
          },

          __children: [{
            __id: 6,
            __type: 'foreach',
            data: {
              e: function() { return this.__parent.data; },
              r: [function() { return this.__parent.__value('data'); }]
            },
            __children: [{
              __id: 7,
              text_7_0: {
                e: function() { return this.data; },
                r: [function() { return this.__value('data'); }]
              },
            }],
          }],

        }],
      }],
    }],
  }],
})
