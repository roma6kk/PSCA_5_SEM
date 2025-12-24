const async = require('async');
const WebSocket = require('rpc-websockets').Client;

let ws = new WebSocket('ws://localhost:4000');

let h = (x => async.parallel({
  sq1: (cb) => {
    ws.call('square', [3])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  sq2: (cb) => {
    ws.call('square', [5, 4])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  mul1: (cb) => {
    ws.call('mul', [3, 5, 7, 9, 11, 13])
      .catch(e => cb(e, null))
      .then(r => cb(null, r));
  },
  mul2: (cb) => {
    ws.call('mul', [2, 4, 6])
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
  }

}, (err, results) => {
  if (err) {
    console.error('Ошибка при выполнении задач:', err.message || err);
    ws.close();
    return;
  }

  try {
    const sumPart = results.sq1 + results.sq2 + results.mul1;

    const fibLast = results.fib7[results.fib7.length - 1];

    const mul2 = results.mul2;

    const result = sumPart + fibLast * mul2;

    console.log('Результат выражения sum(square(3), square(5,4), mul(3,5,7,9,11,13)) + fib(7) * mul(2,4,6) =', result);

  } catch (e) {
    console.error('Ошибка при вычислении результата:', e.message);
  }

  ws.close();
}));

ws.on('open', h);

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});