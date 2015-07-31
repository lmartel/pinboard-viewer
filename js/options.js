// Must be kept in sync with the constant in content.ts
// TODO unify on full Typescript refactor
var IS_CACHED = "localStorage::isCached";

function cursorTimeline(msec1, msec2, fst, snd, cb){
    $('*').css('cursor', fst);
    setTimeout(function(){
        $('*').css('cursor', snd);
        setTimeout(function(){
            $('*').css('cursor', 'default');
            if(cb) cb();
        }, msec1);
    }, msec2);
}

$(function() {
    // localStorage only stores string values
    $('#does-nothing').attr('checked', localStorage[DUMMY_OPTION] === 'true')
    .click(function () {
        var value = $(this).is(':checked');
        localStorage[DUMMY_OPTION] = value;
    });
    $('#resync').click(function(){

        delete localStorage[IS_CACHED];
        chrome.runtime.sendMessage({ message: 'logout' }, function(response){
            if (response.success) {
                cursorTimeline(800, 400, 'wait', 'copy', window.close);
            } else {
                console.log('Backend cache reset failed');
                cursorTimeline(1600, 800, 'wait', 'not-allowed');
            }
        });
    })
});
