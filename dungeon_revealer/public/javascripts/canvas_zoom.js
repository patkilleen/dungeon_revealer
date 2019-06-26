define(function () {
    console.log('canvas_zoom.js starting');

    return function (canvas,img) {
        console.log('creating zoom for canvas');

        if (!canvas) {
            throw new Error('Invalid args');
        }
	 
        var image = img,
			ctx = canvas.getContext('2d'),
			lastX=canvas.width/2,
			lastY=canvas.height/2,
			defaultWidth =canvas.width,
			defaultHeight=canvas.height,
			dragStartX,
			dragStartY,
			dragged,
			scaleFactor=1.05,
			dragFactor=0.3,
			panLocked = false,
			copy = function(zoomer){
				//initValues();	
				//image = zoomer.img,
				lastX = zoomer.lastX;
				lastY= zoomer.lastY;
				defaultWidth= zoomer.defaultWidth;
				defaultHeight= zoomer.defaultHeight;
				dragStartX= zoomer.dragStartX;
				dragStartY= zoomer.dragStartY;
				dragged= zoomer.dragged;
				scaleFactor= zoomer.scaleFactor;
				panLocked= zoomer.panLocked;
			}
			redraw = function(){
			// Clear the entire canvas

				ctx.save();
				ctx.setTransform(1,0,0,1,0,0);
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.restore();

				ctx.drawImage(image,0,0);
			},
			initValues = function(){
				lastX=defaultWidth;
				lastY=defaultHeight;
				dragStartX=null;
				dragStartY=null;
				dragged=null;
				scaleFactor=1.05;
				dragFactor=0.3;
			},
			init = function(mouseEventDOM){
				initValues();
					mouseEventDOM.addEventListener('mousedown',function(evt){
						//only handle right click
						if(evt.which == 3){
							evt.preventDefault();
							document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
							lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
							lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
							dragStartX = lastX;
							dragStartY = lastY;
							dragged = false;
							return false;
						}
					},false);
					mouseEventDOM.addEventListener('mousemove',function(evt){
						//only pan is unlocked
						if(panLocked){
							return;
						}
						
						lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
						lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
						dragged = true;
						//only draw if dragging
						if ((dragStartX != null) || (dragStartY != null)){
							ctx.translate((dragFactor)*(lastX-dragStartX),dragFactor*(lastY-dragStartY));
							redraw();
						}
					},false);
					mouseEventDOM.addEventListener('mouseup',function(evt){
						if(evt.which == 3){
							//show the reset map button
							var resetButton = document.getElementById('btn-map-reset');
							resetButton.style='display: inline-block !important;';
							
							evt.preventDefault();
							dragStartX = null;
							dragStartY = null;
							//if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
							return false;
						}
						
					},false);
			},
			zoom = function(clicks){
				var factor = Math.pow(scaleFactor,clicks);
				ctx.scale(factor,factor);
				redraw();
			},
			handleScroll = function(evt){
				var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
				if (delta) zoom(delta);
				return evt.preventDefault() && false;
			},
			lockPan = function(){
				panLocked = true;
			},
			unlockPan = function(){
				panLocked = false;
			},	

			resetMapImage = function(){
				initValues();
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.resetTransform();
				ctx.drawImage(image,0,0);
			}
					
			return {
				init: init,
				zoom: zoom,
				resetMapImage: resetMapImage,
				lockPan: lockPan,
				unlockPan: unlockPan,
				copy: copy
			}
    };
});


	