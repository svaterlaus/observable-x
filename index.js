const { hasProp } = require('./util')

const validateObserver = (observer) => {
  if (!hasProp(observer, 'next')) {
    throw Error('observer requires a "next" method.')
  } else if (typeof observer.next !== 'function') {
    throw Error(`observer.next must be a Function. Type: ${typeof observer.next}`)
  } else if (observer.error && typeof observer.error !== 'function') {
    throw Error(`observer.error must be a Function. Type: ${typeof observer.error}`)
  } else if (observer.complete && typeof observer.complete !== 'function') {
    throw Error(`observer.complete must be a Function. Type: ${typeof observer.complete}`)
  }
}

const validateProducer = (producer) => {
  if (!hasProp(producer, 'start')) {
  } else if (typeof producer.start !== 'function') {
    throw Error(`producer.start must be a Function. Type: ${typeof producer.start}`)
  } else if (producer.stop && typeof producer.stop !== 'function') {
    throw Error(`producer.stop must be a Function. Type: ${typeof producer.stop}`)
  }
}

const validateID = (id) => {
  if (typeof id !== 'number') throw new Error(`id must be a Number. Type: ${typeof id}`)
}

const validateOperators = (operators) => {
  operators.forEach((operator) => {
    if (typeof operator !== 'function') throw new Error(`operator must be a Function. Type: ${typeof operator}`)
  })
}

function Observable (producer) {
  validateProducer(producer)
  const _running = Symbol('running')
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')
  const _producer = Symbol('producer')
  const _orchestrator = Symbol('orchestrator')

  const self = {
    [_running]: false,
    [_nonce]: 0,
    [_observers]: [],
    [_producer]: producer,
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
      validateObserver(observer)
      const id = self[_nonce]
      self[_observers] = [...self[_observers], { ...observer, _id: id }]
      self[_nonce] += 1
      if (self[_running] === false) {
        self[_running] = true
        self[_producer].start(self[_orchestrator])
      }
      return id
    },
    pipe (...operators) {
      validateOperators(operators)
      return operators.reduce((result, operator) => operator(result), self)
    },
    cancel (id) {
      validateID(id)
      const targetIndex = self[_observers].findIndex(observer => observer._id === id)
      if (targetIndex === -1) throw new Error(`observer not found. ID: ${id}`)
      self[_observers].splice(targetIndex)
      if (!self[_observers].length && self[_producer].stop) {
        self[_running] = false
        self[_producer].stop()
      }
      return id
    },
    cancelAll () {
      const ids = self[_observers].map(observer => observer.id)
      self[_observers] = []
      if (self[_producer].stop) {
        self[_running] = false
        self[_producer].stop()
      }
      return ids
    }
  }

  return self
}

Observable.from = (...values) => Observable({
  start (observer) {
    values.forEach((value, i) => {
      setTimeout(() => {
        observer.next(value)
        if (i === values.length - 1) observer.complete()
      }, 0)
    })
  }
})

Observable.fromTimeout = (delay, value) => Observable({
  start (observer) {
    this.observer = observer
    this.id = setTimeout(() => {
      observer.next(value)
      observer.complete()
    }, delay)
  },
  stop () {
    clearTimeout(this.id)
    this.observer.complete()
  }
})

Observable.fromInterval = (delay) => Observable({
  start (observer) {
    this.observer = observer
    let n = 1
    this.id = setInterval(() => {
      observer.next(n)
      n += 1
    }, delay)
  },
  stop () {
    clearInterval(this.id)
    this.observer.complete()
  }
})

Observable.fromPromise = (promise) => Observable({
  async start (observer) {
    try {
      observer.next(await promise)
      observer.complete()
    } catch (err) {
      observer.error(err)
    }
  }
})

Observable.fromEvent = (target, eventName) => Observable({
  start (observer) {
    this.observer = observer
    target.addEventListener(eventName, observer.next)
  },
  stop () {
    target.removeEventListener(eventName, this.observer.next)
  }
})

function Subject (initialValue) {
  const hasInitialValue = !!arguments.length
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')

  const self = {
    [_nonce]: 0,
    [_observers]: [],

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
    },
    observe (observer) {
      validateObserver(observer)
      const id = self[_nonce]
      if (id === 0 && hasInitialValue) observer.next(initialValue)
      self[_observers] = [...self[_observers], { ...observer, _id: id }]
      self[_nonce] += 1
      return id
    },
    pipe (...operators) {
      validateOperators(operators)
      return operators.reduce((result, operator) => operator(result), self)
    },
    cancel (id) {
      validateID(id)
      const targetIndex = self[_observers].findIndex(observer => observer._id === id)
      if (targetIndex === -1) throw new Error(`observer not found. ID: ${id}`)
      self[_observers].splice(targetIndex)
      return id
    },
    cancelAll () {
      const ids = self[_observers].map(observer => observer.id)
      self[_observers] = []
      return ids
    }
  }

  return self
}

module.exports = {
  Observable,
  Subject
}
