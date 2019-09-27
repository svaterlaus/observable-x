const Observable = require('../core/observable')

const map = (callback) => (observable) => Observable((observer) => {
  const id = observable.observe({
    next (e) { observer.next(callback(e)) },
    error (err) { observer.error(err) },
    complete () { observer.complete() }
  })
  return () => {
    observable.cancel(id)
  }
})

module.exports = map
