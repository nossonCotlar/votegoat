const params = new URLSearchParams(window.location.search);

const pollId = params.get('id');
const socket = io({query: {id: pollId}});

$('#poll-id').text(pollId);
let voteElement = $('#poll');

socket.on('connect', _ => {
    console.log(`Connected with Socket ID: ${socket.id}`);
});

socket.on('vote', data => {
    console.log(data);
});