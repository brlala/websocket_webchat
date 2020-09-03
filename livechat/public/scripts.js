const username = prompt('What is your username?');
// const socket = io('http://localhost:9000');
const socket = io('http://localhost:9000', {
  query: {
    username,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNTA3NzA2ZmY2YjljNjg5ODkwMDllNSIsImZpcnN0TmFtZSI6InRlc3QiLCJsYXN0TmFtZSI6InVzZXIiLCJlbWFpbCI6ImFzZEBhc2QuY29tIiwiaWF0IjoxNTk5MTIyNzcwLCJleHAiOjE2MDY4OTg3NzB9.RjJFk7tN05nw2CH7CWkcdBjG0CCLnjUsF-BF_WJvZOQ',
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
