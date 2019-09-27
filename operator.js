const { Observable } = require('./index.js')

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

module.exports = {
  map,
  filter,
  reduce
}
