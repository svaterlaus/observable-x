const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)

const validate = {
  observer: (observer) => {
    if (!hasProp(observer, 'next')) {
      throw Error('observer requires a "next" method.')
    } else if (typeof observer.next !== 'function') {
      throw Error(`observer.next must be a Function. Type: ${typeof observer.next}`)
    } else if (observer.error && typeof observer.error !== 'function') {
      throw Error(`observer.error must be a Function. Type: ${typeof observer.error}`)
    } else if (observer.complete && typeof observer.complete !== 'function') {
      throw Error(`observer.complete must be a Function. Type: ${typeof observer.complete}`)
    }
  },
  producer: (producer) => {
    if (!hasProp(producer, 'start')) {
    } else if (typeof producer.start !== 'function') {
      throw Error(`producer.start must be a Function. Type: ${typeof producer.start}`)
    } else if (producer.stop && typeof producer.stop !== 'function') {
      throw Error(`producer.stop must be a Function. Type: ${typeof producer.stop}`)
    }
  },
  id: (id) => {
    if (typeof id !== 'number') throw new Error(`id must be a Number. Type: ${typeof id}`)
  },
  operators: (operators) => {
    operators.forEach((operator) => {
      if (typeof operator !== 'function') throw new Error(`operator must be a Function. Type: ${typeof operator}`)
    })
  }
}

module.exports = validate
