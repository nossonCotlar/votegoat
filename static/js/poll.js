let optionsArray = [];

const createPoll = _ => {
    if(optionsArray.length < 1) return;
    const data = {options: optionsArray};
    $.post('poll', data, (data, status, xhr) => {
        console.log(data);
        window.location.assign(data.url);
    });
}

const addOptionButton = _ => {
    const input = $('#option-input');
    const valRaw = input.val();
    if (valRaw == '') return;
    const val = parseFloat(valRaw) || valRaw;
    optionsArray.push(val);
    addOption(val);
    input.val('');
}

const addOption = value => {
    const optionListHolder = $('#poll-options');
    const optionList = $('.poll-option');
    console.log(optionList);
    let newOptionHolder = $('<div></div>').addClass('poll-option-holder');
    let newOption = $('<p></p>').text(value).addClass('poll-option');
    newOptionHolder.append(newOption);
    optionListHolder.append(newOptionHolder);

}

const clickIfEnter = val => {
    if(event.key === 'Enter'){
        $('#add-option-button').click();
    }
}