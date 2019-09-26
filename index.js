const util = require('./util')

const validateObserver = (observer) => {
  if (!util.hasProp(observer, 'next')) {
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
  if (!util.hasProp(producer, 'start')) {
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
      next: (e) => { self[_observers].forEach((observer) => { observer.next(e) }) },
      error: (e) => { self[_observers].forEach((observer) => { observer.error(e) }) },
      complete: (e) => { self[_observers].forEach((observer) => { observer.complete(e) }) }
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
      self[_observers] = [
        ...self[_observers].slice(0, targetIndex),
        ...self[_observers].slice(targetIndex + 1, self[_observers].length)
      ]
      if (self[_observers].length === 0 && self[_producer].stop) self[_producer].stop()
      return id
    },
    cancelAll () {
      const ids = self[_observers].map(observer => observer.id)
      self[_observers] = []
      if (self[_producer].stop) self[_producer].stop()
      return ids
    }
  }

  return self
}

function Subject (initialValue) {
  const hasInitialValue = !!arguments.length
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')

  const self = {
    [_nonce]: 0,
    [_observers]: [],

    next: (e) => { self[_observers].forEach((observer) => { observer.next(e) }) },
    error: (e) => { self[_observers].forEach((observer) => { observer.error(e) }) },
    complete: (e) => { self[_observers].forEach((observer) => { observer.complete(e) }) },
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
      self[_observers] = [
        ...self[_observers].slice(0, targetIndex),
        ...self[_observers].slice(targetIndex + 1, self[_observers].length)
      ]
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
