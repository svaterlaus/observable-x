# observable-x
*Lightweight, "hot", multicast, extensible observables.*

🛑 **WARNING: this library is a work in progress and is not yet recommended for production.**

## Usage
#### Manual Observable Creation
```javascript
const { Observable } = require('observable-x/core')

const names = ['Spencer', 'Charlie', 'Jacob', 'Salomon', 'Ally', 'Sarah', 'Mickey']

const nameProducer = (observer) => {
  let i = 0
  const intervalID = setInterval(() => {
    observer.next(names[i])

    if (i === names.length - 1) {
      observer.complete()
    } else {
      i += 1
    }
  }, 1000);
  return () => {
    clearInterval(intervalID)
  }
}

const name$ = Observable(nameProducer)

name$.observe(name => {
  console.log(`Hello, ${name}!`)
})
```

## todo
- [ ] update with shallow prototypal inheritance
- [ ] create tests for core module
- [ ] create tests for operators module
- [ ] update readme with more details, examples, and API docs
- [ ] create contributing.md
- [ ] create issues for updates and features
- [ ] TBD...
