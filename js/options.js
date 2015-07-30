$(function() {
    // localStorage only stores string values
    $('#does-nothing').attr('checked', localStorage[DUMMY_OPTION] === 'true')
    .click(function () {
        var value = $(this).is(':checked');
        localStorage[DUMMY_OPTION] = value;
    });
});
