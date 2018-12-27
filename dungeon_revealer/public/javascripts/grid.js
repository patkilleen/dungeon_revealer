define(function () {
    console.log('grid.js starting');

    return function (opts) {
        console.log('creating grid object');

        var x1,y1,
			addedGrid=false,
			addGrid = function (canvas,squareSize,color){
				var numCols = canvas.width/squareSize;
				var numRows = canvas.height/squareSize;
				var context = canvas.getContext('2d');

				context.save();
				context.beginPath();
				if(color != undefined){
					context.strokeStyle = color;
				}		
				var row = 0;
				var col = 0;
				context.clearRect(0, 0, canvas.width, canvas.height);
				while (row < numRows){
					col=0;
					while (col < numCols){
						context.rect(col*squareSize, row*squareSize, squareSize, squareSize);
						col++;
					}
					row++;
				}
				context.stroke();
				context.restore();
			},
				
			displayTempGrid = function(squareSize,cursorCanvas){
				//only display blue grid that will be painted if added if no grid on map
				if(!hasGrid()){
					addGrid(cursorCanvas,squareSize,undefined);
				}
			},
			handleGridDistance = function(x,y,cursorCanvas,squareSize){

				var squareSize = gridSlider.value;
				
				
				var dist = distanceFromLastClick(x,y,squareSize);
				if(dist == -1){
					addPointClicked(x,y);
					if(hasGrid()){
						cursorCanvas.getContext('2d').clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
						highlightCell(cursorCanvas,x,y,squareSize);
					}else{
						displayTempGrid(squareSize,cursorCanvas);
						//only color with specifide color if not added grid
						var color = 'rgba(' + opts.gridSelectedRGB + ',' + opts.gridSelectedOpacity + ')';
						highlightCell(cursorCanvas,x,y,squareSize,color);
					}
				}else{
					alert("Distance between these cells is  "+Math.ceil(dist)+" ft (5ft squares).");
					clearPointClicked();
					
					//do we have a grid?
					if(hasGrid()){
						highlightCell(cursorCanvas,x,y,squareSize);
					}else{
						//only color with specifide color if not added grid
						var color = 'rgba(' + opts.gridSelectedRGB + ',' + opts.gridSelectedOpacity + ')';
						highlightCell(cursorCanvas,x,y,squareSize,color);
					}
				}
			},
			highlightCell = function(canvas,x,y,squareSize,color){
				
				var cell = findCellClicked(x,y,squareSize);
				var context = canvas.getContext('2d');
				
				context.save();
				context.beginPath();
				if(color != undefined){
					context.strokeStyle = color;
				}				
				context.rect(cell.col*squareSize, cell.row*squareSize, squareSize, squareSize);
				
				context.stroke();
				context.restore();
			},
			//identifies row and column clicked
			findCellClicked = function (x,y, squareSize){
				return{
					row: Math.floor(y/squareSize),
					col: Math.floor(x/squareSize)
				}
			},
			addPointClicked = function(x,y){
				x1 = x;
				y1 = y;
			},
			distanceFromLastClick = function(x,y,squareSize){
				if(!x1){
					return -1;
				}
				
				var pt1 = findCellClicked(x1,y1,squareSize);
				var pt2 = findCellClicked(x,y,squareSize);
				
				var a = pt1.row - pt2.row;
				var b = pt1.col - pt2.col;

				//assuming 5ft squares
				a=a*5;
				b=b*5;
				//clear the last clicked point
				
				return Math.sqrt(a*a + b*b);
			},
			clearPointClicked = function(){
				x1 = undefined;
				y1 = undefined;
			},
			getPointClicked = function(){
				var pt = new Object();
				pt.x = x1;
				pt.y = y1;
				return pt;
			},
			setGridAdded = function(flag){
				addedGrid=flag
			},
			hasGrid = function(){
				return addedGrid;
			}
        return {
           findCellClicked: findCellClicked,
		   addGrid: addGrid,
		   highlightCell:highlightCell,
		   distanceFromLastClick: distanceFromLastClick,
		   clearPointClicked: clearPointClicked,
		   getPointClicked:getPointClicked,
		   addPointClicked:addPointClicked,
		   hasGrid:hasGrid,
		   setGridAdded:setGridAdded,
		   displayTempGrid:displayTempGrid,
		   handleGridDistance:handleGridDistance
        }
    };
});