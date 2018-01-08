const Koa = require('koa')
const ILP = require('ilp')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const CogKoa = require('../src/koa-cog')
const app = new Koa()
const cog = new CogKoa()
const debug = require('debug')('app')

/*
const payoutReceiver = process.env.PAYOUT_RECEIVER
if (!payoutReceiver) {
  throw new Error('process.env.PAYOUT_RECEIVER must be set.')
}
*/

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  /*
  await ILP.SPSP.sendPayment(ctx.accountant, {
    receiver: payoutReceiver,
    sourceAmount: '10',
    sourceScale: 0,
  })
  */
  await ctx.accountant.awaitBalance(1000)

  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
