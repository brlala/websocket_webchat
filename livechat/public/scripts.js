const username = prompt('What is your username?');
// const socket = io('http://localhost:9000');
const socket = io('http://localhost:9000', {
  query: {
    username,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNTBkZjUwNWYyZWQyMTZmZmM0MGU0YiIsImZpcnN0TmFtZSI6IlVzZXIiLCJsYXN0TmFtZSI6IlBhbmQuYWkiLCJlbWFpbCI6InVzZXJAcGFuZC5haSIsInBlcm1pc3Npb25zIjpbImRlbGV0ZV9jYW5uZWRfcmVzcG9uc2UiLCJlZGl0X3VzZXJfdGFnIiwicmVhZF91c2VyX3RhZyIsImNyZWF0ZV9jYW5uZWRfcmVzcG9uc2UiLCJyZWFkX2Nhbm5lZF9yZXNwb25zZSIsImVkaXRfY2FubmVkX3Jlc3BvbnNlIiwiY3JlYXRlX3VzZXIiXSwiaWF0IjoxNjAwNjc5NDc4LCJleHAiOjE2MDg0NTU0Nzh9.BC1EHtkXJOUZnr_T5WkJG-MCjHTpKQrBbIAoFv6l3AI',
  },
});
socket.username = username;

let nsSocket = '';

// listen for nsList, which is a list of all the namespaces
socket.on('nsList', (nsData) => {
  const namespacesDiv = document.querySelector('.namespaces');
  namespacesDiv.innerHTML = '';
  nsData.forEach((ns) => {
    namespacesDiv.innerHTML += `<div class="namespace" ns="${ns.endpoint}"><img src="${ns.img}" /></div>`;
  });

  // Add a clicklistener for each NS
  Array.from(document.getElementsByClassName('namespace')).forEach((elem) => {
    elem.addEventListener('click', (e) => {
      const nsEndpoint = elem.getAttribute('ns');
      // console.log(`${nsEndpoint}  I should go to now`);
      joinNs(nsEndpoint);
    });
  });
  joinNs('/wiki');
});

socket.on('authentication-error', (msg) => {
  console.log(msg);
});
