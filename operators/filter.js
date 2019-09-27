const Observable = require('../core/observable')

const filter = (callback) => (observable) => Observable((observer) => {
  const id = observable.observe({
    next (e) { if (callback(e)) observer.next(e) },
    error (err) { observer.error(err) },
    complete () { observer.complete() }
  })
  return () => {
    observable.cancel(id)
  }
})

module.exports = filter
