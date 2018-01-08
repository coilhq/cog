const Koa = require('koa')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const CogKoa = require('../src/koa-cog')
const app = new Koa()
const cog = new CogKoa()
const debug = require('debug')('app')

router.options('/', cog.options())
router.get('/', cog.paid(), async ctx => {
  debug('main middleware')
  await ctx.accountant.awaitBalance(10)

  debug('sending response body')
  ctx.body = { foo: 'bar' }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
