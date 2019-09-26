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

function Observable (producer) {
  validateProducer(producer)
  const _running = Symbol('running')
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')
  const _producer = Symbol('producer')
  const _orchestrator = Symbol('orchestrator')

  const props = {
    [_running]: false,
    [_nonce]: 0,
    [_observers]: [],
    [_producer]: producer,
    [_orchestrator]: {
      next: (e) => { props[_observers].forEach((observer) => { observer.next(e) }) },
      error: (e) => { props[_observers].forEach((observer) => { observer.error(e) }) },
      complete: (e) => { props[_observers].forEach((observer) => { observer.complete(e) }) }
    }
  }

  const methods = {
    observe (observer) {
      validateObserver(observer)
      const id = props[_nonce]
      props[_observers] = [...props[_observers], { ...observer, _id: id }]
      props[_nonce] += 1
      if (props[_running] === false) {
        props[_running] = true
        props[_producer].start(props[_orchestrator])
      }
      return id
    },
    cancel (id) {
      validateID(id)
      const targetIndex = props[_observers].findIndex(observer => observer._id === id)
      if (targetIndex === -1) throw new Error(`observer not found. ID: ${id}`)
      props[_observers] = [
        ...props[_observers].slice(0, targetIndex),
        ...props[_observers].slice(targetIndex + 1, props[_observers].length)
      ]
      if (props[_observers].length === 0 && props[_producer].stop) props[_producer].stop()
      return id
    },
    cancelAll () {
      const ids = props[_observers].map(observer => observer.id)
      props[_observers] = []
      if (props[_producer].stop) props[_producer].stop()
      return ids
    }
  }

  return { ...props, ...methods }
}

function Subject (initialValue) {
  const hasInitialValue = !!arguments.length
  const _nonce = Symbol('nonce')
  const _observers = Symbol('observers')

  const props = {
    [_nonce]: 0,
    [_observers]: []
  }

  const methods = {
    next: (e) => { props[_observers].forEach((observer) => { observer.next(e) }) },
    error: (e) => { props[_observers].forEach((observer) => { observer.error(e) }) },
    complete: (e) => { props[_observers].forEach((observer) => { observer.complete(e) }) },
    observe (observer) {
      validateObserver(observer)
      const id = props[_nonce]
      if (id === 0 && hasInitialValue) observer.next(initialValue)
      props[_observers] = [...props[_observers], { ...observer, _id: id }]
      props[_nonce] += 1
      return id
    },
    cancel (id) {
      validateID(id)
      const targetIndex = props[_observers].findIndex(observer => observer._id === id)
      if (targetIndex === -1) throw new Error(`observer not found. ID: ${id}`)
      props[_observers] = [
        ...props[_observers].slice(0, targetIndex),
        ...props[_observers].slice(targetIndex + 1, props[_observers].length)
      ]
      return id
    },
    cancelAll () {
      const ids = props[_observers].map(observer => observer.id)
      props[_observers] = []
      return ids
    }
  }

  return { ...props, ...methods }
}

module.exports = {
  Observable,
  Subject
}
