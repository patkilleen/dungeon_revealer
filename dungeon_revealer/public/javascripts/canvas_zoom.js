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
			dragStartX,
			dragStartY,
			dragged,
			scaleFactor=1.1,
			redraw = function(){
			// Clear the entire canvas

			ctx.save();
			ctx.setTransform(1,0,0,1,0,0);
			ctx.clearRect(0,0,canvas.width,canvas.height);
			ctx.restore();

			ctx.drawImage(image,0,0);
		},
		init = function(mouseEventDOM){
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
					
					lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
					lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
					dragged = true;
					if ((dragStartX != null) || (dragStartY != null)){
						ctx.translate(lastX-dragStartX,lastY-dragStartY);
						redraw();
					}
				},false);
				mouseEventDOM.addEventListener('mouseup',function(evt){
					if(evt.which == 3){
						evt.preventDefault();
						dragStartX = null;
						dragStartY = null;
						//if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
						return false;
					}
					
				},false);
				
				mouseEventDOM.addEventListener('DOMMouseScroll',handleScroll,false);
				mouseEventDOM.addEventListener('mousewheel',handleScroll,false);
				mouseEventDOM.addEventListener('wheel',handleScroll,false);
		},
		zoom = function(clicks){
			ctx.translate(lastX,lastY);
			var factor = Math.pow(scaleFactor,clicks);
			ctx.scale(factor,factor);
			ctx.translate(-lastX,-lastY);
			redraw();
		},
		handleScroll = function(evt){
			var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
			if (delta) zoom(delta);
			return evt.preventDefault() && false;
		}
	
        return {
            init: init
        }
    };
});


	