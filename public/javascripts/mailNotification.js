
//chwilowo nie uzywane
var msg = document.querySelector('.response');

var socket = io.connect();


socket.on('msgSent', function(data) {
    msg.innerHTML='Maile wysłane: ' + data;
});

socket.on('msgErr', function(data) {
    msg.innerHTML='Błąd przy wysyłaniu maili: ' + data;
});