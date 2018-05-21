# Cog
> A contract engine driven by streaming payments

```js
const Koa = require('koa')
const KoaCog = require('koa-cog')
const SPSP = require('ilp-protocol-spsp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const app = new Koa()
const cog = new KoaCog()

router.get('/', cog.paid(), async ctx => {
  const accountant = new KoaCog.Accountant(ctx.ilpStream)

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
