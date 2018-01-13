const Koa = require('koa')
const ILP = require('ilp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const Cog = require('..')
const app = new Koa()
const cog = new Cog.KoaCog()
const debug = require('debug')('app')
const payoutReceiver = '$sharafian.com'

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  debug('quoting SPSP payment to developer. pointer=' + payoutReceiver)
  const quote = await ILP.SPSP.quote(ctx.accountant, {
    receiver: payoutReceiver,
    sourceAmount: '1000',
    sourceScale: 0,
  })

  debug('sending SPSP payment to developer. pointer=' + payoutReceiver)
  await ILP.SPSP.sendPayment(ctx.accountant, quote)

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
