// userInfo: name, pwd, isChecked
var _userInfo = null, _tags = [], keyPrefix = 'pbuinfo',
checkedkey = keyPrefix + 'c',
namekey = keyPrefix + 'n', pwdkey = keyPrefix + 'p',
authTokenKey = keyPrefix + '_auth_token',

// dummy config option in the settings
DUMMY_OPTION = keyPrefix + 'dummyoption',

mainPath = 'https://api.pinboard.in/v1/',

yesIcon = '/img/icon_colored_19.png',
noIcon = '/img/icon_grey_19.png',
savingIcon = '/img/icon_grey_saving_19.png';

var REQ_TIME_OUT = 125 * 1000, maxDescLen = 500;
