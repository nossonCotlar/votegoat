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
    drawPollMetrics(data);
    drawVoteOptions(data);
});

const drawPollData = pollData => {
    const holder = $('#poll-data-holder');
    const sortedPoll = sortOptionsOnVotes(pollData);
    console.log(sortedPoll);
    holder.text('');
    for(i in sortedPoll){
        const pollEntry = sortedPoll[i];
        holder.append(makePollDataEntry(pollEntry[0], pollEntry[1] == 0 ? '-' : pollEntry[1]));
    }
}

const drawPollMetrics = pollData => {
    const entries = Object.entries(pollData);
    let metrics = [];

    // calculate mean average
    const allNumbers = entries.reduce((flag, entry) => isNaN(entry[0]) ? false : flag, true);
    if(allNumbers) {
        console.log('Calculating Mean Average!')
        const sum = entries.reduce((sum, entry) => sum + parseFloat(entry[0]) * entry[1], 0);
        const amt = entries.reduce((sum, entry) => sum + entry[1], 0);
        const mean = (sum / amt) || '-';
        const meanMetric = makePollMetric('Mean Average', mean);
        metrics.push(meanMetric);
    }

    const sortedPoll = sortOptionsOnVotes(pollData);
    
    // calculate median average
    let expandedPoll = [];
    for(let i = 0; i < sortedPoll.length; i++){
        for(let j = 0; j < sortedPoll[i][1]; j++){
            expandedPoll.push(sortedPoll[i][0]);
        }
    }
    const expandedLength = expandedPoll.length;
    const midpoint = Math.floor((expandedLength - 1) / 2);
    console.log(expandedPoll, midpoint)
    const median = expandedPoll[midpoint] || '-';
    metrics.push(makePollMetric('Median Average', median));

    // calculate mode average
    const mode = sortedPoll[0][0];
    metrics.push(makePollMetric('Mode Average', mode));

    $('#poll-metrics-holder').empty();
    $('#poll-metrics-holder').append(metrics);
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
        vt.success('Vote has been cast!');
        $('#vote-section').hide();
    }).fail(data => {
        console.log(data);
        let message = '';
        if(data.status == 403) {
            message = data.responseJSON.error;
            $('#vote-section').hide();
        }
        else {
            message = `Something went wrong :( Here's the error: ${JSON.stringify(data.responseJSON)}`
        }
        vt.error(message, {title: "Whoops!", duration: 7000});
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

const makePollMetric = (title, value) => {
    const metric      = $('<div></div>', {class: 'poll-metric'});
    console.log(metric)
    const metricTitle = $(`<div><a>${title}</a></div>`).addClass('poll-metric-title');
    const metricValue = $(`<div><a>${value}</a></div>`).addClass('poll-metric-value');
    metric.append([metricTitle, metricValue]);
    return metric;
}

const copyLinkToClipboard = el => {
    const copyText = $('#link-copy-text');
    copyText.select();
    console.log(copyText)
    document.execCommand('copy');
    vt.info('Poll Link is Copied to your Clipboard :)');
}