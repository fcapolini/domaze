## Github

* [Publishing Node.js packages](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages)
* [Adding a workflow status badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/adding-a-workflow-status-badge)
* [Vitest Badge Action](https://github.com/marketplace/actions/vitest-badge-action)
* [About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)

## Testing

* [vitest + happy-dom](https://vitest.dev/config/#environment)

```js
import { test, expect } from 'vitest';

/**
 * @vitest-environment happy-dom
 */

test('use happy-dom in this test file', () => {
  const element = document.createElement('div')
  expect(element).not.toBeNull()
})
```

## MDN

* [Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
