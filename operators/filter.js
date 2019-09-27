const Observable = require('../core/observable')

const filter = (callback) => (observable) => Observable({
  start (observer) {
    this.id = observable.observe({
      next (e) { if (callback(e)) observer.next(e) },
      error (err) { observer.error(err) },
      complete () { observer.complete() }
    })
  },
  stop () {
    observable.cancel(this.id)
  }
})

module.exports = filter
