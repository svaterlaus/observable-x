const validate = require('./validate')

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
      validate.observer(observer)
      const id = self[_nonce]
      if (id === 0 && hasInitialValue) observer.next(initialValue)
      self[_observers] = [...self[_observers], { ...observer, _id: id }]
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

module.exports = Subject
