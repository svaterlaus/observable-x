const { Observable } = require('../core/observable')

const map = (callback) => (observable) => Observable({
  start (observer) {
    this.id = observable.observe({
      next (e) { observer.next(callback(e)) },
      error (err) { observer.error(err) },
      complete () { observer.complete() }
    })
  },
  stop () {
    observable.cancel(this.id)
  }
})

exports = map
