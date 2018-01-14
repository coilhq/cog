# Cog
> A contract engine driven by streaming payments

```js
const Koa = require('koa')
const ILP = require('ilp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const CogKoa = require('../src/koa-cog')
const app = new Koa()
const cog = new CogKoa()

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  const quote = await ILP.SPSP.quote(cog.accountant, {
    receiver: '$sharafian.com',
    sourceAmount: '1000',
    sourceScale: 0,
  })

  // Before completing this call, the contract will wait
  // for 1000 to arrive in its account.
  await ILP.SPSP.sendPayment(cog.accountant, quote)

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
```
