$(function() {
  var datasource = '/data/precipitation-small.json';

  xhr = new XMLHttpRequest();
  xhr.open('GET', datasource, true);

  xhr.onreadystatechange = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // var ungzipped = JXG.decompress(xhr.responseText);
        var ungzipped = xhr.responseText;
        var data = JSON.parse(ungzipped);
        window.data = data;
        $('body').addClass('loaded');
        console.log(data);

      plot_array(ctx, data[0]['data']);
      }
    };
  };
  xhr.send();

  var width = 960,
      height = 500;

  var canvas = $('<canvas></canvas>')
      .attr("width", width)
      .attr("height", height);
  $("body").append(canvas);

  var ctx = canvas[0].getContext("2d");
  console.log(ctx);

  var convert_coordinates = function(latitude, longitude) {
    x = (width*(180+longitude)/360)%width+(width/2);
    const PI = Math.PI;
    const tan = Math.tan;
    const log = Math.log;

    // convert from degrees to radians
    latRad = latitude*PI/180;

    // get y value
    mercN = log(tan((PI/4)+(latRad/2)));
    y     = (height/2)-(width*mercN/(2*PI));
    return [x - width / 2, y]
  };

  var plot_array = function(ctx, array) {
    for (var i = 0; i < array.length; ++i) {
      var obj = array[i];

      coords = convert_coordinates(obj['lat'], obj['lon']);
      console.log(coords);
      x = coords[0], y = coords[1];
      ctx.beginPath();
      ctx.fillStyle = "white"
      ctx.arc(x, y, 1, 0, 2 * Math.PI, true);
      ctx.fill();
    }
  }

});