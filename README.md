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

cog.listen((accountant) => {
  await accountant.awaitBalance(1010)

  const result = await agent
    .get('paid.example.com')
    .pay(accountant, 1000)

  await ILP.SPSP.SendPayment(accountant, {
    receiver: process.env.DEVELOPER_RECEIVER,
    sourceAmount: 10
  })

  return result.body
})
```
