# Cog
> A contract engine driven by streaming payments

```js
const ILP = require('ilp')
const { HttpCog } = require('cog')
const receiver = require('ilp-plugin')
const cog = new HttpCog({
  port: 8080,
  plugin: receiver
})

cog.listen(({
  plugin,
  buffer
}) => {
  await buffer(1010)

  const result = await agent
    .get('paid.example.com')
    .pay(plugin, 1000)

  await ILP.SPSP.SendPayment({
    receiver: process.env.DEVELOPER_RECEIVER,
    sourceAmount: 10
  })

  return result.body
})
```
