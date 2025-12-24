const rpcWSS = require('rpc-websockets').Server;

let server = new rpcWSS({port: 4000, host:'localhost'});

server.setAuth((l) => {return (l.login == 'arv' && l.password == '777')});
server.register('square', (params) => {
  if(params.length == 1)
      return params[0] * params[0];
  else 
    return params[0] * params[1];
}).public();
server.register('sum', (params) => {
  let sum = 0;
  for(i = 0; i < params.length; i++)
  {
    sum += params[i];
  }
  return sum;
}).public();
server.register('mul', (params) => {
  let mul = 1;
  for(i = 0; i < params.length; i++)
  {
    mul *= params[i];
  }
  return mul;
}).public();
server.register('fib', (params) => {
  const n = params[0];
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence[i] = sequence[i - 1] + sequence[i - 2];
  }
  return sequence;
}).protected();
server.register('fact', (params) => {
  const n = params[0];
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}).protected();