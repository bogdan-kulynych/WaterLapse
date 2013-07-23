;(function($) {
    'use strict';

    $(function(){
        var count = 1320,
            months = ['January', 'February', 'March', 'April', 'May',
                      'June', 'July', 'August', 'September', 'October',
                       'November', 'December'],
            dataFolderUrl = 'images/frames/';

        var $body = $('body');

        for (var month = 0; month < 12; month ++) {
            $body.append('<div><h2>' + months[month] + '</h2><ol></ol></div>');
            var container = $('ol').last();
            for (var i = 0; i < count; i+=12) {
                var id = ('00000' + (i + month +1)).slice(-5);
                container.append('<li><span>' + (1901 + i/12) +
                    '</span><img src="' + dataFolderUrl +
                     'blue precipitation_' + id + '.png"/></li>');
            }
        }
    });
})(jQuery);
