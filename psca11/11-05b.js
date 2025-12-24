const async = require('async');
const WebSocket = require('rpc-websockets').Client;

let ws = new WebSocket('ws://localhost:4000');

let h = (x => async.parallel({
  square3: (cb) => {
    ws.call('square', [3])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  square54: (cb) => {
    ws.call('square', [5, 4])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  sum2: (cb) => {
    ws.call('sum', [2])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  sum246810: (cb) => {
    ws.call('sum', [2, 4, 6, 8, 10])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  mul3: (cb) => {
    ws.call('mul', [3])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  mul35791113: (cb) => {
    ws.call('mul', [3, 5, 7, 9, 11, 13])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },

  fib1: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fib', [1]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  fib2: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fib', [2]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  fib7: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fib', [7]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  fact0: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fact', [0]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  fact5: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fact', [5]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  fact10: (cb) => {
    ws.login({ login: 'arv', password: '777' })
      .then(login => {
        if (login) {
          return ws.call('fact', [10]);
        } else {
          throw new Error('Login failed');
        }
      })
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  }

}, (err, results) => {
  if (err) {
    console.error('Ошибка выполнения параллельных задач:', err.message || err);
  } else {
    console.log('Результаты:');
    console.log('square(3) =', results.square3);
    console.log('square(5,4) =', results.square54);
    console.log('sum(2) =', results.sum2);
    console.log('sum(2,4,6,8,10) =', results.sum246810);
    console.log('mul(3) =', results.mul3);
    console.log('mul(3,5,7,9,11,13) =', results.mul35791113);
    console.log('fib(1) =', results.fib1);
    console.log('fib(2) =', results.fib2);
    console.log('fib(7) =', results.fib7);
    console.log('fact(0) =', results.fact0);
    console.log('fact(5) =', results.fact5);
    console.log('fact(10) =', results.fact10);
  }

  ws.close();
}));

ws.on('open', h);

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});