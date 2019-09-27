const validate = require('./validate')

function Observable (producer) {
  validate.producer(producer)
  const _running = Symbol('running')
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')
  const _stopProducer = Symbol('stopProducer')
  const _orchestrator = Symbol('orchestrator')

  const self = {
    [_running]: false,
    [_nonce]: 0,
    [_observers]: [],
    [_stopProducer]: null,
    [_orchestrator]: {
      next: (e) => {
        self[_observers].forEach((observer) => {
          observer.next(e)
        })
      },
      error: (err) => {
        self[_observers].forEach((observer) => {
          if (observer.error) {
            observer.error(err)
          } else {
            throw err
          }
        })
      },
      complete: () => {
        self[_observers].forEach((observer) => {
          if (observer.complete) observer.complete()
        })
      }
    },

    observe (observer) {
      const id = self[_nonce]
      if (typeof observer === 'function') {
        self[_observers].push({ next: observer, _id: id })
      } else {
        validate.observer(observer)
        self[_observers].push({ ...observer, _id: id })
      }
      if (self[_running] === false) {
        self[_running] = true
        self[_stopProducer] = producer(self[_orchestrator])
      }
      self[_nonce] += 1
      return id
    },
    pipe (...operators) {
      validate.operators(operators)
      return operators.reduce((result, operator) => operator(result), self)
    },
    cancel (id) {
      validate.id(id)
      const targetIndex = self[_observers].findIndex(observer => observer._id === id)
      if (targetIndex === -1) throw new Error(`observer not found. ID: ${id}`)
      self[_observers].splice(targetIndex)
      if (!self[_observers].length && self[_stopProducer]) {
        self[_running] = false
        self[_stopProducer]()
      }
      return id
    },
    cancelAll () {
      const ids = self[_observers].map(observer => observer.id)
      self[_observers] = []
      if (self[_stopProducer]) {
        self[_running] = false
        self[_stopProducer]()
      }
      return ids
    }
  }

  return self
}

Observable.from = (...values) => Observable((observer) => {
  values.forEach((value, i) => {
    setTimeout(() => {
      observer.next(value)
      if (i === values.length - 1) observer.complete()
    }, 0)
  })
})

Observable.fromTimeout = (delay, value) => Observable((observer) => {
  const id = setTimeout(() => {
    observer.next(value)
    observer.complete()
  }, delay)
  return () => {
    clearTimeout(id)
    observer.complete()
  }
})

Observable.fromInterval = (delay) => Observable((observer) => {
  let n = 1
  const id = setInterval(() => {
    observer.next(n)
    n += 1
  }, delay)
  return () => {
    clearInterval(id)
    observer.complete()
  }
})

Observable.fromPromise = (promise) => Observable((observer) => {
  promise.then((result) => {
    observer.next(result)
    observer.complete()
  }).catch((err) => {
    observer.error(err)
  })
})

Observable.fromEvent = (target, eventName) => Observable((observer) => {
  target.addEventListener(eventName, observer.next)
  return () => { target.removeEventListener(eventName, observer.next) }
})

module.exports = Observable
