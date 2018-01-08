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
const payoutReceiver = process.env.PAYOUT_RECEIVER

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  await ILP.SPSP.sendPayment(ctx.accountant, {
    receiver: payoutReceiver,
    sourceAmount: '1000',
    sourceScale: 0,
  })

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
```
