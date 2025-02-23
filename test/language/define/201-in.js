({
  __id: 0,
  __children: [{
    __id: 1,
    __name: 'page',
    __children: [
      {
        __id: 2,
        __name: 'head',
        __children: [
          {
            __id: 3,
            __type: 'define',
            __defines: 'app-card',
            __children: [
              {
                __id: 4,
                __children: []
              }
            ]
          },
        ]
      },
      {
        __id: 5,
        __name: 'body',
        __children: [
          {
            __id: 6,
            __type: 'instance',
            __uses: 'app-card',
            v: {
              e: function () {
                return 'x';
              }
            },
            text_6_0: {
              e: function () {
                return this.v;
              },
              r: [function () {
                return this.__value('v');
              }]
            },
            __children: []
          }
        ]
      }
    ]
  }]
});
