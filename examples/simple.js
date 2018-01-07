const Koa = require('koa')
const router = require('koa-router')()
const parser = require('koa-bodyparser')()
const CogKoa = require('../src/koa-cog')
const app = new Koa()
const cog = new CogKoa()
const debug = require('debug')('app')

router.get('/', cog.cog(), async ctx => {
  debug('main middleware')
  const foo = await ctx.accountant.getValue('bar')
  const bar = await ctx.accountant.getValue('baz')

  debug('sending response body')
  ctx.body = {
    foo,
    bar
  }
})

app
  .use(parser)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8090)
