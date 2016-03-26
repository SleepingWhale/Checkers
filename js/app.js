function Board(side) {
  this.side = side;
  var grid = [];
  for (var i = 0; i < side; i++) {
    grid[i] = [];
    for (var j = 0; j < side; j++) {
      grid[i][j] = 0;
    }
  }
  this.grid = grid;
}
Board.prototype.drawBoard = function(targetElement) {
  var table = document.createElement('table'),
    filler, ceil, row, i, j;
  table.className = 'playBoard';
  for (i = 0; i < this.side; i++) {
    row = document.createElement('tr');
    for (j = 0; j < this.side; j++) {
      ceil = document.createElement('td');
      if (i === 0) {
        ceil.setAttribute('letter-sign', String.fromCharCode(65+j));
      }
      if (j === 0) {
        ceil.setAttribute('numeric-sign', (i+1).toString());
      }
      filler = document.createElement('div');
      filler.className = 'filler';
      ceil.appendChild(filler);
      row.appendChild(ceil);
    }
    table.appendChild(row);
  }
  var fillers = table.getElementsByClassName('filler');
  targetElement.appendChild(table);

  function actualResizeHandler() {
    var size = fillers[0].offsetWidth;
    Array.slice.call(fillers, fillers).forEach(function(e) {
      e.style.height = size + 'px';
    });
  }

  (function() {
    window.addEventListener("resize", resizeThrottler, false);
    var resizeTimeout;

    function resizeThrottler() {
      if (!resizeTimeout) {
        resizeTimeout = setTimeout(function() {
          resizeTimeout = null;
          actualResizeHandler();
        }, 66);
      }
    }

  })();
  actualResizeHandler();
};



//test
var test = new Board(8);
test.drawBoard(document.getElementsByClassName('tableWrapper')[0]);
