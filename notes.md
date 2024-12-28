## Github

* [Publishing Node.js packages](https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-nodejs-packages)
* [Adding a workflow status badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/monitoring-workflows/adding-a-workflow-status-badge)
* [Vitest Badge Action](https://github.com/marketplace/actions/vitest-badge-action)
* [About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)

## Compiler requirements

* [ ] prevent declaring '__'-prefixed values (they're reserved to implementation)
* [ ] check foreach contains a single scope
* [ ] tags w/ a __slot prop must have their own scope
* [ ] slot tags must have a valid __name and no children/values/functions

## TODO

* [ ] page
  * [x] server-side dom + parser and preprocessor
  * [ ] server-side load
    * [ ] scopes
      * [x] logic values
      * [x] attr values
      * [x] class values
      * [x] style values
    * [ ] texts
  * [ ] server-side replication
  * [ ] client-side reload
  * [ ] client-side replication
