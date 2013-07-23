;(function($) {
    'use strict';

    $(function() {
        // Warning: The following code is extremely spaghetti
        // Done in 1.5 day on NASA Space Challenge Hackathon

        // Configuration
        var datasource = 'data/precipitation.json',
            datessource = 'data/precipitation-dates.json',
            colors = ['#EDECEA',  '#C8E1E7',  '#ADD8EA',
                      '#7FB8D4',  '#4EA3C8',  '#2586AB'],
            animationDelay = 200,
            yearskip = 3,
            ratio = 1 / 2;

        // Globals
        var common = {
            scale: [],

            timelineWidth: 0,
            currentFrame: 0,
            framesCount: 0,
            datesCount: 0,

            years: 0,

            playing: false,

            width: window.innerWidth,
            height: ratio * window.innerWidth,

            ctx: null,

            fadeTimeout: null,
            frameTimeout: null,

            data: null
        };

        // http://stackoverflow.com/questions/14034455/translating-lat-long-to-actual-screen-x-y-coordinates-on-a-equirectangular-map
        var equirectangular = function(latitude, longitude) {
            var x = ((longitude + 180) * (common.width  / 360));
            var y = (((latitude * -1) + 90) * (common.height/ 180));
            return [x, y];
        };

        // http://stackoverflow.com/questions/14329691/covert-latitude-longitude-point-to-a-pixels-x-y-on-mercator-projection
        var mercator = function(latitude, longitude) {
            var x = (common.width*(180+longitude)/360)%common.width+(common.width/2);

            // convert from degrees to radians
            var latRad = latitude*Math.PI/180;

            // get y value
            var mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
            var y     = (common.height/2)-(common.width*mercN/(2*Math.PI));
            return [x - common.width / 2, y];
        };

        // returns [x, y] which corresponds to latitude and longitude
        var convertCoordinates = function(latitude, longitude) {
            return equirectangular(latitude, longitude);
        };

        // returns an array [value, color], sorted by value
        // All values <= value, have color color
        // result: [1, 'red'], [3, blue], [5, green] means:
        //   (-infinity, 1] -> red
        //   (1, 3]         -> blue
        //   (3, 5]         -> blue
        var getColorScale = function(data, colors) {
            var min = Infinity,
                max = -Infinity;
            for(var i = 0; i < data.length; ++i) {
                var values = data[i];
                for (i in values) {
                    var v = values[i].value;
                    if (v > max) { max = v; }
                    if (v < min) { min = v; }
                }
            }
            var size = max - min,
                step = size/(colors.length-1),
                scale = [[min, colors[0]]];
            for (var i = 1; i < colors.length; i++) {
                scale.push([min + i * step, colors[i]]);
            }
            return scale;
        };

        var getColor = function(value, scale) {
            var max;
            for (var i=0; i < scale.length; i++) {
                max = scale[i][0];
                if (value <= max) {
                    return scale[i][1];
                }
            }
        };

        var plotArray = function(ctx, array, resolution, colorScale) {
            ctx.clearRect(0, 0, common.width, common.height);
            for (var i = 0; i < array.length; ++i) {
                var obj = array[i];

                var coords = convertCoordinates(obj.lat, obj.lon),
                    x = Math.round(coords[0]),
                    y = Math.round(coords[1]),

                    coords2 = convertCoordinates(obj.lat +
                                resolution, obj.lon + resolution),
                    x2 = Math.round(coords2[0]),
                    y2 = Math.round(coords2[1]),
                    color = getColor(obj.value, colorScale);

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x2, y);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x, y2);
                ctx.lineTo(x, y);
                ctx.fillStyle = color;
                ctx.fill();
            }
        };

        var movePointer = function(x, nodraw) {
            var pointer = $('#pointer');
            if (x <= common.timelineWidth) {
                pointer.css({
                    'left': x + 'px'
                });
                if (!nodraw) {
                    var frame = Math.round((x / common.timelineWidth) *
                        (common.framesCount - 1));
                    showFrame(frame);
                }
            }
            var hover = $('.hover');
            if (!hover.is(':visible')) {
                hover.fadeIn('slow');
            } else {
                hover.css({
                    'left': x + 'px',
                    'top': ($('#pointer').offset.top - 30) + 'px'
                });
            }
        };

        var showFrame = function(frame) {
            common.currentFrame = frame;
            if (common.currentFrame < common.framesCount) {
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                plotArray(common.ctx, common.data[frame], 2.5, common.scale);

                var date = months[frame % 12] + ' ' +
                              common.years[Math.floor(frame / 12)];
                $('.hover').html(date);
            }
        };

        var nextFrame = function(link) {
            if (common.currentFrame < common.framesCount) {
                common.currentFrame++;
                movePointer((common.currentFrame / common.framesCount) * common.timelineWidth, true);
                showFrame(common.currentFrame);
            } else {
                common.playing = false;
                $('.animation-controls .play').show();
                $('.animation-controls .stop').hide();
            }
            if (link) {
                clearTimeout(common.frameTimeout);
                common.frameTimeout = setTimeout(function() {
                    nextFrame(true);
                }, animationDelay);
            }
        };

        var startAnimation = function() {
            common.playing = true;
            common.frameTimeout = setTimeout(function() {
                nextFrame(true);
            }, animationDelay);
        };

        var stopAnimation = function() {
            clearTimeout(common.frameTimeout);
        };

        $.getJSON(datasource, function(data) {
            common.data = data;
            common.framesCount = Object.keys(data).length;

            $.getJSON(datessource, function(years) {
                common.years = years;
                for (var i = 0; i < years.length; ++i) {
                    if (parseInt(years[i], 10) % yearskip === 0) {
                        common.datesCount++;
                        var year = $('<li></li>').html(years[i]);
                        $('#slider .timeline').append(year);
                    }
                }
                common.timelineWidth = $('#slider .timeline').width();
            });

            $('#slider').fadeIn('slow');
            $('.animation-controls .play').fadeIn('slow');

            var pointer = $('<span></span>')
                  .attr('id', 'pointer');
            $('#slider').append(pointer);

            $('#slider .timeline').click(function(e) {
                common.playing = false;
                $('.animation-controls .play').show();
                $('.animation-controls .stop').hide();

                clearTimeout(common.frameTimeout);
                movePointer(e.pageX);
            });

            $('body').bind('mousemove click', function() {
                var controls = $('.animation-controls');
                controls.fadeIn('fast');
                clearTimeout(common.fadeTimeout);
                common.fadeTimeout = setTimeout(function() {
                    controls.fadeOut('slow');
                }, 750);
            });

            $('.animation-controls .play').click(function() {
                startAnimation();
                $('.animation-controls .play').hide();
                $('.animation-controls .stop').show();
            });

            $('.animation-controls .stop').click(function() {
                stopAnimation();
                $('.animation-controls .play').show();
                $('.animation-controls .stop').hide();
            });

            var canvas = $('<canvas></canvas>')
                  .addClass('map')
                  .attr('width', common.width)
                  .attr('height', common.height);

            $('body').prepend(canvas);

            common.ctx = canvas[0].getContext('2d');
            common.scale = getColorScale(data, colors);

            $('body').addClass('loaded');
            showFrame(0);
        });
    });
})(jQuery);
