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
    console.log(ctx);

    plot_array(ctx, data[0]['data']);
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
    x = ((longitude + 180) * (width  / 360));
    y = (((latitude * -1) + 90) * (height/ 180));
    return [x, y]
  };

  // http://stackoverflow.com/questions/14329691/covert-latitude-longitude-point-to-a-pixels-x-y-on-mercator-projection
  var mercator = function(latitude, longitude) {
    x = (width*(180+longitude)/360)%width+(width/2);

    // convert from degrees to radians
    latRad = latitude*Math.PI/180;

    // get y value
    mercN = Math.log(Math.tan((Math.PI/4)+(latRad/2)));
    y     = (height/2)-(width*mercN/(2*PI));
    return [x - width / 2, y]
  };

  var convert_coordinates = function(latitude, longitude) {
    return equirectangular(latitude, longitude);
  };

  var plot_array = function(ctx, array) {
    console.log(array);
    for (var i = 0; i < array.length; ++i) {
      var obj = array[i];

      coords = convert_coordinates(obj['lat'], obj['lon']);
      x = coords[0], y = coords[1];

      ctx.beginPath();
      ctx.fillStyle = "white"
      ctx.arc(x, y, 1, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  };
})();