const { Observable } = require('./index.js')

const map = (fn) => (observable) => Observable({
  start (observer) {
    this.id = observable.observe({
      next (e) { observer.next(fn(e)) },
      error (err) { observer.error(err) },
      complete () { observer.complete() }
    })
  },
  stop () {
    observable.cancel(this.id)
  }
})

module.exports = {
  map
}
