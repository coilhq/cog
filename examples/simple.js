const Koa = require('koa')
const SPSP = require('ilp-protocol-spsp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const Cog = require('..')
const app = new Koa()
const cog = new Cog()
const debug = require('debug')('app')
const payoutReceiver = '$spsp.ilp-test.com'

router.get('/', cog.paid(), async ctx => {
  const accountant = new Cog.Accountant(ctx.ilpStream)

  debug('sending SPSP payment to developer. pointer=' + payoutReceiver)
  await SPSP.pay(accountant, {
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
