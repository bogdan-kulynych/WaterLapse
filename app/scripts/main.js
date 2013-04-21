(function() {
  var datasource = '/data/precipitation-small.json';

  xhr = new XMLHttpRequest();
  xhr.open('GET', datasource, true);

  $.getJSON(datasource, function(data) {
    window.data = data;

    var ratio = 1 / 2;
    window.width = window.innerWidth,
    window.height = ratio * width;

    var canvas = $('<canvas></canvas>')
        .addClass('map')
        .attr("width", width)
        .attr("height", height);
    $("body").append(canvas);

    var ctx = canvas[0].getContext("2d");
    ctx.globalAlpha = 0.6;


    var color_scale = get_color_scale(data, ["rgba(0, 0, 0, 0.8)", '#EDECEA',  '#C8E1E7',  '#ADD8EA',  '#7FB8D4',  '#4EA3C8',  '#2586AB']);
    $('body').addClass('loaded');

    // XXX this should be in the data
    var resolution = 2.5;
    plot_array(ctx, data[0]['data'], resolution, color_scale);
  });

  $('body').bind('mousemove click', function() {
    var hide_timeout = 500;
    var fade_timeout = 500;

    $('#slider').fadeIn(fade_timeout);
    clearTimeout(window.slider_timeout);
    window.slider_timeout = setTimeout(function() {
      console.log('slider hides now');
      $('#slider').fadeOut(fade_timeout);
    }, hide_timeout);
  });

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
    for(date_index in data) {
      values = data[date_index].data;
      for (var i =0; i < values.length; i++) {
        var v = values[i].value;
        if (v > max) { max = v; }
        if (v < min) { min = v; }
      }
    }
    var size = max - min;
    var step = size/(colors.length-1);
    var scale = [[min, colors[0]]]
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
  }
})();
