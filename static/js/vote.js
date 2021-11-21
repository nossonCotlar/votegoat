const params = new URLSearchParams(window.location.search);

const pollId = params.get('id');
const socket = io({query: {id: pollId}});

$('#link-copy-text').val(window.location.href);

socket.on('connect', _ => {
    console.log(`Connected with Socket ID: ${socket.id}`);
});

socket.on('vote', data => {
    console.log(data);
    drawPollData(data);
    drawVoteOptions(data);
});

const drawPollData = pollData => {
    const holder = $('#poll-data-holder');
    const sortedPoll = sortOptionsOnVotes(pollData);
    console.log(sortedPoll);
    holder.text('');
    for(i in sortedPoll){
        const pollEntry = sortedPoll[i];
        holder.append(makePollDataEntry(pollEntry[0], pollEntry[1]));
    }
}

const drawVoteOptions = pollData => {
    const holder = $('#vote-options');
    holder.text('');
    const keys = Object.keys(pollData);
    for(i in keys){
        const key = keys[i];
        holder.append(makeVoteOption(key));
    }
}

const placeVote = voteOptionEl => {
    const voteOption = $(voteOptionEl).attr('option-value');
    console.log(`Placing vote for option: ${voteOption}`);
    $.post(`/vote/${pollId}`, {option: voteOption}, (data, status, xhr) => {
        console.log(data, status)
    });

}

const sortOptionsOnVotes = pollData => {
    return Object.entries(pollData).sort((a, b) => b[1] - a[1]);
}

const makePollDataEntry = (name, value) => {
    const entry = $('<div></div>').addClass('poll-data-entry');
    entry.append($('<div></div>').addClass('poll-data-entry-name').text(name));
    entry.append($('<div></div>').addClass('poll-data-entry-value').text(value));
    return entry;
}

const makeVoteOption = (name) => {
    const entry = $('<button></button>');
    entry.addClass('vote-option');
    entry.attr('option-value', name);
    entry.attr('onclick', 'placeVote(this)');
    entry.val(name);
    entry.text(name);
    return entry;
}

const copyLinkToClipboard = el => {
    const copyText = $('#link-copy-text');
    copyText.select();
    console.log(copyText)
    document.execCommand('copy');
    vt.info('Poll Link is Copied to your Clipboard :)');
}