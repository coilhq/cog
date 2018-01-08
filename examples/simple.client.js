const { call } = require('../src/client')

call({
  url: 'localhost:8090/',
  method: 'get',
  body: {}
})
  .then((response) => {
    console.log(JSON.stringify(response.body))
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
