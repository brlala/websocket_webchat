const ip = require('ip');

// const { networkInterfaces } = require('os');

function getLocalIp() {
  // const nets = networkInterfaces();
  // let results = Object.create(null); // or just '{}', an empty object
  //
  // for (const name of Object.keys(nets)) {
  //   for (const net of nets[name]) {
  //     // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
  //     if (net.family === 'IPv4' && !net.internal) {
  //       if (!results[name]) {
  //         results[name] = [];
  //       }
  //
  //       results[name].push(net.address);
  //     }
  //   }
  // }
  // results = Object.entries(results).reduce((a, [k, v]) => (v ? (a[k] = v, a) : a), {});
  // return results;
  return ip.address();
}

function getFormattedIpAddress() {
  const localIp = getLocalIp();
  return localIp ? localIp.replace(/\./g, '-') : 'ip_not_found';
}

module.exports = {
  getLocalIp,
  getFormattedIpAddress,
};
