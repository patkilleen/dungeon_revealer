define(function () {
    console.log('brush.js starting');

    return function (darkCanvasContext,dimCanvasContext, settings) {
        console.log('creating brush');

        if (!darkCanvasContext || !dimCanvasContext || !settings) {
            throw new Error('Invalid args');
        }
					
        var brushTypes = ["Light", "Dim", "Dark"],
			LIGHT_IX = 0,
			DIM_IX = 1,
			DARK_IX = 2,
            currentBrushType = LIGHT_IX,
            currentPattern = null,
            setBrushType = function () {
                console.error("Doesn't exist yet");
            },
            toggle = function () {
                currentBrushType = (currentBrushType +1) % brushTypes.length;
                var strokeStyle = getCurrent();
				darkCanvasContext.strokeStyle = strokeStyle.dark;
				dimCanvasContext.strokeStyle = strokeStyle.dim;
				
				//hide or show fog all button
				var dom = document.getElementById('btn-shroud-all');
				if(currentBrushType == LIGHT_IX){
					dom.style='display: none';	//hide
				}else{
					dom.style='display: inline-block !important;';
				}
				
            },
			fogMap = function(width,height){
				var currCtx = getBrushContext();
				var otherCtx = undefined;
				var fillStyle =  getCurrent();
				if(currCtx == dimCanvasContext){
					otherCtx = darkCanvasContext;
					currCtx.fillStyle =fillStyle.dim;
					
				}else{
					otherCtx = dimCanvasContext;
					currCtx.fillStyle =fillStyle.dark;
				}
				
				currCtx.fillRect(0, 0, width, height);
				otherCtx.fillRect(0, 0, width, height);
			},
			
			clearMap = function(width,height){
				
				//change the brush to light temporarily
				var fillStyle = getPattern(LIGHT_IX);
				dimCanvasContext.fillStyle = fillStyle.dim;
				darkCanvasContext.fillStyle = fillStyle.dark;
				dimCanvasContext.fillRect(0, 0, width, height);
				darkCanvasContext.fillRect(0, 0, width, height);
				
				//reset to old brush
				fillStyle = getCurrent();
			}
            getPattern = function (brushType) {
                if (brushType === LIGHT_IX) {
                    darkCanvasContext.globalCompositeOperation = 'destination-out';
					dimCanvasContext.globalCompositeOperation = 'destination-out';
                    return {
					dim: 'rgba(' + settings.fogDimRGB + ',' + settings.fogDimOpacity + ')',
					dark: 'rgba(' + settings.fogDarkRGB + ',' + settings.fogDarkOpacity + ')'
					};
                } else if (brushType === DARK_IX) {
                    darkCanvasContext.globalCompositeOperation = 'source-over';
					dimCanvasContext.globalCompositeOperation = 'destination-out';
                    return {
					dim: 'rgba(' + settings.fogDimRGB + ',' + settings.fogDimOpacity + ')',
					dark: 'rgba(' + settings.fogDarkRGB + ',' + settings.fogDarkOpacity + ')'
					};
                }else{ //DIM
                    dimCanvasContext.globalCompositeOperation = 'source-over';
					darkCanvasContext.globalCompositeOperation = 'destination-out';
                    return {
					dim: 'rgba(' + settings.fogDimRGB + ',' + settings.fogDimOpacity + ')',
					dark: 'rgba(' + settings.fogDarkRGB + ',' + settings.fogDarkOpacity + ')'
					};
                }

            },
			getBrushContext = function(){
				if(currentBrushType === DIM_IX){
					return dimCanvasContext;
				}else{
					return darkCanvasContext;
				}
			},
            getCurrent = function () {
                return getPattern(currentBrushType);
            }
			getCurrentBrush = function () {
                return brushTypes[currentBrushType];
            }

        return {
            brushTypes: brushTypes,
            currentBrushType: currentBrushType,
            setBrushType: setBrushType,
            toggle: toggle,
            getCurrent: getCurrent,
            getPattern: getPattern,
			getCurrentBrush: getCurrentBrush,
			getBrushContext:getBrushContext,
			fogMap: fogMap,
			clearMap: clearMap
        }
    };
});