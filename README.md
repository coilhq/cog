# Cog
> A contract engine driven by streaming payments

```js
const Koa = require('koa')
const SPSP = require('ilp-protocol-spsp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const CogKoa = require('../src/koa-cog')
const CogAccountant = require('../src/cog-accountant')
const app = new Koa()
const cog = new CogKoa()

router.get('/', cog.paid(), async ctx => {
  const accountant = new CogAccountant(ctx.ilpStream)

  // Before completing this call, the contract will wait
  // for 1000 to arrive in its account.
  await SPSP.pay(accountant, {
    receiver: '$sharafian.com',
    sourceAmount: '1000'
  })

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
```
