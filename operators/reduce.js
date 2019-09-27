const Observable = require('../core/observable')

const reduce = (callback, initialValue) => (observable) => Observable((observer) => {
  let state = initialValue
  const id = observable.observe({
    next (e) {
      state = callback(state, e)
      observer.next(state)
    },
    error (err) { observer.error(err) },
    complete () { observer.complete() }
  })
  return () => {
    observable.cancel(id)
  }
})

module.exports = reduce
