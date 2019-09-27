const { Observable } = require('../core/observable')

const reduce = (callback, initialValue) => (observable) => Observable({
  start (observer) {
    let state = initialValue
    this.id = observable.observe({
      next (e) {
        state = callback(state, e)
        observer.next(state)
      },
      error (err) { observer.error(err) },
      complete () { observer.complete() }
    })
  },
  stop () {
    observable.cancel(this.id)
  }
})

exports = reduce
