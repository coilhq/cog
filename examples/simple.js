const Koa = require('koa')
const SPSP = require('ilp-protocol-spsp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const Cog = require('..')
const app = new Koa()
const cog = new Cog.KoaCog()
const debug = require('debug')('app')
const payoutReceiver = '$sharafian.com'

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  debug('sending SPSP payment to developer. pointer=' + payoutReceiver)
  await SPSP.pay(ctx.accountant, {
    receiver: payoutReceiver,
    sourceAmount: '1000'
  })

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
