$(function() {
  // Warning: The following code is extremely macaronic
  var datasource = '/data/precipitation.json';
  var datessource = '/data/precipitation-dates.json';
  var colors = ['#EDECEA',  '#C8E1E7',  '#ADD8EA',  '#7FB8D4',  '#4EA3C8',  '#2586AB'];

  var animation_delay = 200;
  var yearskip = 3;
  var scale = [];
  var timeline_width = 0;
  var current_frame = 0;
  var dates_count = 0;
  var frames_count = 0;

  var playing = false;

  // http://stackoverflow.com/questions/14034455/translating-lat-long-to-actual-screen-x-y-coordinates-on-a-equirectangular-map
  var equirectangular = function(latitude, longitude) {
    var x = ((longitude + 180) * (width  / 360));
    var y = (((latitude * -1) + 90) * (height/ 180));
    return [x, y]
  };

  // http://stackoverflow.com/questions/14329691/covert-latitude-longitude-point-to-a-pixels-x-y-on-mercator-projection
  var mercator = function(latitude, longitude) {
    var x = (width*(180+longitude)/360)%width+(width/2);

    // convert from degrees to radians
    var latRad = latitude*Math.PI/180;

    // get y value
    var mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
    var y     = (height/2)-(width*mercN/(2*PI));
    return [x - width / 2, y]
  };

  // returns [x, y] which corresponds to latitude and longitude
  var convert_coordinates = function(latitude, longitude) {
    return equirectangular(latitude, longitude);
  };

  // returns an array [value, color], sorted by value
  // All values <= value, have color color
  // result: [1, 'red'], [3, blue], [5, green] means:
  //   (-infinity, 1] -> red
  //   (1, 3]         -> blue
  //   (3, 5]         -> blue
  var get_color_scale = function(data, colors) {
    var min = Infinity;
    var max = -Infinity;
    for(var i = 0; i < data.length; ++i) {
      values = data[i];
      for (i in values) {
        v = values[i].value;
        if (v > max) { max = v; }
        if (v < min) { min = v; }
      }
    }
    var size = max - min;
    var step = size/(colors.length-1);
    scale = [[min, colors[0]]]
    for (var i=1; i<colors.length; i++) {
      scale.push([min + i * step, colors[i]]);
    }
    return scale;
  }

  var get_color = function(value, scale) {
    var max;
    for (var i=0; i<scale.length; i++) {
      max = scale[i][0];
      if (value <= max) {
        return scale[i][1];
      }
    }
  }

  var plot_array = function(ctx, array, resolution, color_scale) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < array.length; ++i) {
      var obj = array[i];

      var coords = convert_coordinates(obj['lat'], obj['lon']);
      var x = Math.round(coords[0]); var y = Math.round(coords[1]);
      var coords2 = convert_coordinates(obj['lat'] + resolution, obj['lon'] + resolution);
      var x2 = Math.round(coords2[0]); var y2 = Math.round(coords2[1]);
      var color = get_color(obj['value'], color_scale)

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

  var move_pointer = function(x, nodraw) {
    var pointer = $('#pointer');
    if (x <= timeline_width) {
      pointer.stop().animate({
        'left': x + 'px'
      });
      if (!nodraw) {
        frame = Math.round((x / timeline_width) * (frames_count - 1));
        show_frame(frame);
      }
    }
    var hover = $('.hover');
    if (!hover.is(':visible')) {
      hover.fadeIn('slow');
    }
    hover.animate({
      'left': x + 'px',
      'top': ($('#pointer').offset.top - 20) + 'px'
    });
    console.log(hover.offset());
  }

  var show_frame = function(frame) {
    current_frame = frame;
    if (current_frame < frames_count) {
      plot_array(window.ctx, window.data[frame], 2.5, scale);
      months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      date = months[frame % 12] + ' ' + window.years[Math.floor(frame / 12)];
      $('.hover').html(date);
    }
  };

  var next_frame = function(link) {
    if (current_frame < frames_count) {
      current_frame++;
      move_pointer((current_frame / frames_count) * timeline_width, true);
      show_frame(current_frame);
    } else {
      playing = false;
      $('.animation-controls .play').show();
      $('.animation-controls .stop').hide();
    }
    if (link) {
      clearTimeout(window.frame_timeout);
      window.frame_timeout = setTimeout(function() {
         next_frame(true);
      }, animation_delay);
    }
  }

  var start_animation = function() {
    playing = true;
    window.frame_timeout = setTimeout(function() {
      next_frame(true);
    }, animation_delay);
  };

  var stop_animation = function() {
    clearTimeout(window.frame_timeout);
  }

  $.getJSON(datasource, function(data) {
    window.data = data;
    frames_count = Object.keys(data).length;

    // displaying years in timeline
    $.getJSON(datessource, function(years) {
      window.years = years;
      for (var i = 0; i < years.length; ++i) {
        if (parseInt(years[i]) % yearskip == 0) {
          dates_count++;
          var year = $('<li></li>').html(years[i]);
          $('#slider .timeline').append(year);
        }
      }
      timeline_width = $('#slider .timeline').width();
    });
    $('#slider').fadeIn('slow');
    $('.animation-controls .play').fadeIn('slow');

    // setting map
    var ratio = 1 / 2;
    window.width = window.innerWidth,
    window.height = ratio * width;

    var canvas = $('<canvas></canvas>')
        .addClass('map')
        .attr("width", width)
        .attr("height", height);
    $("body").prepend(canvas);

    window.ctx = canvas[0].getContext("2d");

    scale = get_color_scale(data, colors);
    $('body').addClass('loaded');
    show_frame(0);
  });

  var pointer = $('<span></span>')
              .attr('id', 'pointer')
  $('#slider').append(pointer);

  $('#slider .timeline').click(function(e) {
    playing = false;
    $('.animation-controls .play').show();
    $('.animation-controls .stop').hide();
    clearTimeout(window.frame_timeout);
    move_pointer(e.pageX);
  });
  $('body').bind('mousemove click', function(e) {
    var controls = $('.animation-controls');
    controls.fadeIn('fast');
    clearTimeout(window.fade_timeout);
    window.fade_timeout = setTimeout(function() {
      controls.fadeOut('slow');
    }, 750);
  });
  $('.animation-controls .play').click(function(){
    start_animation();
    $('.animation-controls .play').hide();
    $('.animation-controls .stop').show();
  })
  $('.animation-controls .stop').click(function(){
    stop_animation();
    $('.animation-controls .play').show();
    $('.animation-controls .stop').hide();
  });
});
