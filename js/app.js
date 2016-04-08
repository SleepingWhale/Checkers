//(function(){
// game board constructor
function Board(side) {
  this.side = side;
  var grid = [];
  for (var i = 0; i < side; i++) {
    grid[i] = [];
    for (var j = 0; j < side; j++) {
      grid[i][j] = false;
    }
  }
  this.grid = grid;
  this.boardElement = null;
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
        ceil.setAttribute('letter-sign', String.fromCharCode(65 + j));
      }
      if (j === 0) {
        ceil.setAttribute('numeric-sign', (this.side - i).toString());
      }
      filler = document.createElement('div');
      filler.setAttribute('location', i + ',' + j);
      filler.className = 'filler';
      ceil.appendChild(filler);
      row.appendChild(ceil);
    }
    table.appendChild(row);
  }
  this.boardElement = table;
  var fillers = table.getElementsByClassName('filler');
  targetElement.appendChild(table);

  function actualResizeHandler() {
    var size = fillers[0].offsetWidth;
    [].slice.call(fillers, fillers).forEach(function(e) {
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
Board.prototype.placeFigure = function(figure, newPosition) {
  if (figure.position) {
    this.grid[figure.position[0]][figure.position[1]] = false;
  }
  this.grid[newPosition[0]][newPosition[1]] = figure;
  figure.position = newPosition;

  this.boardElement
    .querySelector("div[location='" + figure.position.toString() + "']")
    .appendChild(figure.element);
};
Board.prototype.removeFigure = function(figure) {
  figure.beaten = true;
  this.grid[figure.position[0]][figure.position[1]] = false;
  this.boardElement
    .querySelector("div[location='" + figure.position.toString() + "']")
    .removeChild(figure.element);
};
Board.prototype.getFigureFrom = function(position) {
  if (!Array.isArray(position)) {
    position = position.split(',').map(Number);
  }
  if (position[0] < 0 || position[0] > this.side - 1 || position[1] < 0 || position[1] > this.side - 1) {
    return undefined;
  }
  return this.grid[position[0]][position[1]];
};
Board.prototype.getNeighbors = function(figure) {
  var result, i, point1, point2, checkingPosition,
    kingResult = [],
    tmpResult,
    row = figure.position[0],
    col = figure.position[1];
  result = [
    [this.getFigureFrom([row - 1, col - 1]), [row - 1, col - 1]],
    [this.getFigureFrom([row - 1, col + 1]), [row - 1, col + 1]],
    [this.getFigureFrom([row + 1, col - 1]), [row + 1, col - 1]],
    [this.getFigureFrom([row + 1, col + 1]), [row + 1, col + 1]]
  ];
  if (!figure.king) {
    return result;
  } else {
    for (i = 0; i < result.length; i++) {
      if (result[i][0] === undefined) {
        continue;
      } else {
        tmpResult = [];
        tmpResult.push(result[i]);
        point1 = figure.position;
        point2 = result[i][1];
        while (true) {
          checkingPosition = this.getNextPosition(point1, point2);
          if (checkingPosition[0] === undefined) {
            break;
          }
          point1 = point2;
          point2 = checkingPosition[1];
          tmpResult.push(checkingPosition);
        }
      }
      kingResult.push(tmpResult);
    }
    return kingResult;
  }
};
Board.prototype.getNextPosition = function(point1, point2) {
  var point3 = [point2[0] + (point2[0] - point1[0]), point2[1] + (point2[1] - point1[1])];
  return [this.getFigureFrom(point3), point3];
};

// Figures constructor. true - white, false - black
var Figure = (function() {
  var figureId = 0;
  return function(color) {
    this.color = color;
    this.position = false;
    this.element = document.createElement('div');
    this.element.className = 'figureRegular';
    this.element.className += (this.color) ? ' figureWhite' : ' figureBlack';
    this.king = false;
    this.beaten = false;

    Object.defineProperty(this, 'id', {
      value: figureId++,
      writable: false,
      enumerable: true,
      configurable: false
    });
  };
})();

Figure.prototype.makeKing = function() {
  this.king = true;
  this.element.className += ' figureSuper';
};

Figure.prototype.makeBeaten = function() {
  this.beaten = true;
  this.element.style.backgroundColor = 'pink';
};

Figure.prototype.makeSelected = (function() {
  var exSelected;
  return function() {
    if (exSelected instanceof Figure) {
      exSelected.removeSelection();
    }
    exSelected = this;
    this.element.className += " figureSelected";
  };
})();

Figure.prototype.removeSelection = function() {
  this.element.className = this.element.className.replace(' figureSelected', '');
};

// Player constructor
function Player(id, color) {
  this.id = id;
  this.name = 'ИГРОК ' + id;
  this.color = color;
  this.nameElement = document.getElementById('player' + id + 'Name');
  this.panelElement = document.getElementById('player' + id + 'Panel');
  this.wins = 0;
  this.stopwatch = 0;
  this.stopwatchElement = document.getElementById('player' + id + 'stopwatch');
  this.taken = 0;
  this.takenElement = document.getElementById('player' + id + 'Taken');
}

// Room constructor
function PlayRoom() {
  this.players = [new Player(1, true), new Player(2, false)];
  this.currentPlayer = this.players[1];
  this.otherPlayer = this.players[0];
  this.messageElement = document.getElementById('showMessage');
  this.totalScoreElement = document.getElementById('totalScore');
  this.tableSpace = document.getElementById('tableWrapper');
  this.resetElement = document.getElementById('reset');
  this.boardBGElement = document.getElementById('boardBG');
}

PlayRoom.prototype.tick = function() {
  this.currentPlayer.stopwatch += 1;
  this.currentPlayer.stopwatchElement.textContent = this.convertTime(this.currentPlayer.stopwatch);
};

PlayRoom.prototype.startStopwatch = function() {
  this.intevalId = setInterval(this.tick.bind(this), 1000);
};

PlayRoom.prototype.stopStopwatch = function() {
  if (this.intevalId) {
    clearInterval(this.intevalId);
  }
};

PlayRoom.prototype.resetStopwatch = function() {
  var i;
  for (i = 0; i < this.players.length; i++) {
    this.players[i].stopwatch = 0;
    this.players[i].stopwatchElement.textContent = this.convertTime(this.players[i].stopwatch);
  }
};

PlayRoom.prototype.switchPlayers = function() {
  this.stopStopwatch();
  this.currentPlayer.panelElement.className = 'panel panel-default';
  this.otherPlayer = [this.currentPlayer, this.currentPlayer = this.otherPlayer][0];
  this.currentPlayer.panelElement.className = 'panel panel-primary';
  if (this.currentPlayer.color) {
    this.boardBGElement.className = this.boardBGElement.className.replace(' up', ' down');
  } else {
    this.boardBGElement.className = this.boardBGElement.className.replace(' down', ' up');
  }
  this.startStopwatch();
};

PlayRoom.prototype.convertTime = function(time) {
  var min = Math.floor(time / 60),
    sec = time % 60;
  return ((min < 10) ? '0' : '') + min + ' : ' + ((sec < 10) ? '0' : '') + sec;
};

PlayRoom.prototype.setNames = function() {
  var element, player;
  for (player in this.players) {
    element = this.players[player].nameElement;
    if (element.value.length > 0) {
      this.players[player].name = element.value;
    } else {
      element.value = this.players[player].name;
    }
    element.setAttribute('disabled', '');
    this.saveData('player' + this.players[player].id, this.players[player].name);
  }
};

PlayRoom.prototype.setBeatenScore = function(flag) {
  var i;
  if (flag === true) {
    for (i = 0; i < this.players.length; i++) {
      this.players[i].taken = 0;
      this.players[i].takenElement.textContent = 0;
    }
  } else {
    this.currentPlayer.takenElement.textContent = ++this.currentPlayer.taken;
  }
};

PlayRoom.prototype.setTotalScore = function(flag) {
  var i;
  if (flag === false) {
    for (i = 0; i < this.players.length; i++) {
      this.players[i].wins = 0;
    }
  }
  if (flag === true) {
    this.otherPlayer.wins++;
  }
  this.saveData('wins1', this.players[0].wins);
  this.saveData('wins2', this.players[1].wins);
  this.totalScoreElement.textContent = this.players[0].wins + ' : ' + this.players[1].wins;
};

PlayRoom.prototype.saveData = function(key, value) {
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem(key, value);
  } else {
    console.log('localStorage is unavailable');
  }
};


PlayRoom.prototype.start = function() {
  if (typeof(Storage) !== "undefined") {
    if (localStorage.getItem("player1") !== null) {
      this.players[0].name = localStorage.getItem("player1");
      this.players[1].name = localStorage.getItem("player2");
      if (localStorage.getItem("wins1") !== null) {
        this.players[0].wins = Number(localStorage.getItem("wins1"));
        this.players[1].wins = Number(localStorage.getItem("wins2"));
        this.setTotalScore(); //
      }
      this.init();
      return;
    }
  } else {
    console.log('localStorage is unavailable');
  }
  this.showMessage('Выбираем имена, начинаем игру нажатием на сообщение.', this.init);
};

PlayRoom.prototype.init = function() {
  this.setNames();
  game = new Game();
  game.init(this.tableSpace);
  game.makeTurn();
  this.resetElement.addEventListener('click', this.reset.bind(this), false);
};

PlayRoom.prototype.reset = function() {
  var player;
  this.setTotalScore(false);
  this.stopStopwatch();
  for (player in this.players) {
    this.players[player].nameElement.removeAttribute('disabled');
  }

  this.showMessage("Можно поменять имена. Нажмите сюда для начала игры.", this.gameReloading);
};

PlayRoom.prototype.gameReloading = function() {
  this.setBeatenScore(true);
  this.resetStopwatch();
  this.setNames();
  this.tableSpace.removeChild(game.board.boardElement);
  game = new Game();
  game.init(this.tableSpace);
  this.currentPlayer = this.players[1];
  this.otherPlayer = this.players[0];
  game.makeTurn();
};

PlayRoom.prototype.showMessage = function(msg, callback) {
  this.messageElement.textContent = msg;
  this.messageElement.style.display = 'block';
  var tryThis = callback.bind(this);
  var doFunktion = function(callback) {
    var clone = this.messageElement.cloneNode(true);
    this.messageElement.parentNode.replaceChild(clone, this.messageElement);
    this.messageElement = clone;
    callback();
    this.messageElement.style.display = 'none';
  };
  this.messageElement.addEventListener('click', doFunktion.bind(this, tryThis), false);
};



// Checkers game constructor
function Game() {
  this.selectedFigure = false;
  this.fightMode = false;
  this.allFigures = [];
  this.mandatoryMoves = [];
  this.possibleMoves = {};
  this.beatenFigures = [];
}

Game.prototype.init = function(el) {
  var i, j, o, figureBlack, figureWhite,
    figureRows = 1;
  this.board = new Board(8);
  this.board.drawBoard(el);
  this.board.boardElement.addEventListener('click', this.move.bind(this), false);
  // positioning figures
  for (i = 0; i < figureRows; i++) {
    if (i % 2 === 0) {
      j = 1;
      o = 0;
    } else {
      j = 0;
      o = 1;
    }

    for (; j < this.board.side; j += 2, o += 2) {
      figureBlack = new Figure(false);
      figureWhite = new Figure(true);
      this.allFigures.push(figureBlack, figureWhite);
      this.board.placeFigure(figureBlack, [i, j]);
      this.board.placeFigure(figureWhite, [i + this.board.side - figureRows, o]);
    }
  }
};



Game.prototype.removeBeatenFigures = function() {
  var i;
  if (this.beatenFigures.length > 0) {
    for (i = 0; i < this.beatenFigures.length; i++) {
      this.board.removeFigure(this.beatenFigures[i]);
      room.setBeatenScore();
    }
    this.beatenFigures = [];
  }
};

Game.prototype.checkBeatenFigures = function() {
  var i;
  for (i = 0; i < this.beatenFigures.length; i++) {
    this.beatenFigures[i].makeBeaten();
  }
};

Game.prototype.isKing = function(figure) {
  if (figure.color && figure.position[0] === 0 || !figure.color && figure.position[0] === this.board.side - 1) {
    figure.makeKing();
  }
};

Game.prototype.isWinner = function() {
  var gameOver = true,
    move;
  if (Object.getOwnPropertyNames(this.possibleMoves).length > 0) {
    for (move in this.possibleMoves) {
      if (this.possibleMoves[move]) {
        gameOver = false;
      }
    }
  }

  if (gameOver) {
    room.setTotalScore(true);
    room.stopStopwatch.call(room);
    room.showMessage('У нас есть победитель: "' + room.otherPlayer.name + '". Нажать здесь для начала новой партии.', room.gameReloading);
  }
};

Game.prototype.makeTurn = function() {
  var i;
  this.removeBeatenFigures();
  this.mandatoryMoves = [];
  this.possibleMoves = {};
  this.selectedFigure = false;
  this.fightMode = false;
  room.switchPlayers(); //?
  for (i = 0; i < this.allFigures.length; i++) {
    if (this.allFigures[i].beaten === false &&
      this.allFigures[i].color === room.currentPlayer.color) {
      if (this.getPossibleMoves(this.allFigures[i])) {
        this.fightMode = true;
      }
    }
  }
  game.isWinner();
};

Game.prototype.getPossibleMoves = function(thisFigure) {
  var neighbors, i, j, m, nextPosition, lineBefore, lineAfter, ceil,
    flag = false;
  this.possibleMoves[thisFigure.id] = false;
  if (thisFigure.king === false) {
    neighbors = this.board.getNeighbors(thisFigure);
    for (i = 0; i < neighbors.length; i++) {
      if (neighbors[i][0] === false &&
        thisFigure.color && i < 2 ||
        !thisFigure.color && i >= 2) {
        if (!this.possibleMoves[thisFigure.id]) {
          this.possibleMoves[thisFigure.id] = [];
        }
        this.possibleMoves[thisFigure.id].push(neighbors[i][1]);
      }
      if (neighbors[i][0] instanceof Figure &&
        !neighbors[i][0].beaten &&
        neighbors[i][0].color !== thisFigure.color) {
        nextPosition = this.board.getNextPosition(thisFigure.position, neighbors[i][0].position);
        if (nextPosition[0] === false) {
          this.mandatoryMoves.push([thisFigure, [nextPosition[1]], neighbors[i][0]]);
          flag = true;
        }
      }
    }
  } else {
    this.possibleMoves[thisFigure.id] = [];
    neighbors = this.board.getNeighbors(thisFigure);
    for (i = 0; i < neighbors.length; i++) {
      lineBefore = [];
      lineAfter = [];
      for (j = 0; j < neighbors[i].length; j++) {
        ceil = neighbors[i][j];
        if (ceil[0] === false) {
          lineBefore.push(ceil[1]);
        } else {
          if (ceil[0].color === thisFigure.color) {
            break;
          } else if (!ceil[0].beaten) {
            if ((j + 1) in neighbors[i]) {
              nextPosition = neighbors[i][j + 1];
              if (nextPosition[0] === false) {
                for (++j; j < neighbors[i].length; j++) {
                  if (neighbors[i][j][0] === false) {
                    lineAfter.push(neighbors[i][j][1]);
                  } else {
                    break;
                  }
                }
                this.mandatoryMoves.push([thisFigure, lineAfter, ceil[0]]);
                flag = true;
              } else {
                break;
              }
            }
          }
        }
      }
      for (m = 0; m < lineBefore.length; m++) {
        this.possibleMoves[thisFigure.id].push(lineBefore[m]);
      }
    }
  }
  return flag;
};

Game.prototype.isMoveAlloved = function(destination) {
  var i, j,
    thisFigure = this.selectedFigure;

  function compare(arr1, arr2) {
    return arr1[0] === arr2[0] && arr1[1] === arr2[1];
  }
  if (this.mandatoryMoves.length > 0) {
    for (i = 0; i < this.mandatoryMoves.length; i++) {
      if (this.mandatoryMoves[i][0].id === this.selectedFigure.id) {
        for (j = 0; j < this.mandatoryMoves[i][1].length; j++) {
          if (compare(this.mandatoryMoves[i][1][j], destination)) {
            this.beatenFigures.push(this.mandatoryMoves[i][2]);
            return true;
          }
        }
      }
    }
    console.log('there is mandatory moves'); //delete
    return false;
  }
  if (this.possibleMoves[thisFigure.id]) {
    for (i = 0; i < this.possibleMoves[thisFigure.id].length; i++) {
      if (compare(this.possibleMoves[thisFigure.id][i], destination)) {
        return true;
      }
    }
  } else {
    console.log('no moves for this figure'); //delete
  }
  return false;
};

Game.prototype.move = function(e) {
  var destination;
  //select figure
  if (e.target.className.search('figureRegular') >= 0) {
    this.selectedFigure = this.board.getFigureFrom(e.target.parentElement.getAttribute('location'));
    if (this.selectedFigure.color !== room.currentPlayer.color) {
      this.selectedFigure = false;
    } else {
      this.selectedFigure.makeSelected();
    }
    return;
  }
  //make step
  if (e.target.hasAttribute('location') && this.selectedFigure) {
    destination = e.target.getAttribute('location').split(',').map(Number);
    if (this.isMoveAlloved(destination)) {
      this.board.placeFigure(this.selectedFigure, destination);
      this.checkBeatenFigures();
      this.isKing(this.selectedFigure);
    } else {
      return;
    }
    //in fight
    if (this.fightMode) {
      this.mandatoryMoves = [];
      if (this.getPossibleMoves(this.selectedFigure)) {
        return;
      } else {
        this.makeTurn();
      }

    } else {
      this.makeTurn();
    }
  }
};

var game;
var room = new PlayRoom();
room.start();
//})();
