$(document).ready(function(){
  var count = 1320;
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  for (var month = 0; month < 12; month ++) {
    $('body').append('<div><h2>' + months[month] + '</h2><ol></ol></div>');
    var container = $('ol').last();
    for (var i = 0; i < count; i+=12) {
      container.append('<li><span>' + (1901 + i/12) + '</span><img src="blue precipitation_' + ('00000' + (i + month +1)).slice(-5) + '.png"/></li>')
    }
  }

})
