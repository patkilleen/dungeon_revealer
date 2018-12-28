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
				updateContextStrokeStyle();
				
            },
			setBrushType = function (type){
				if((type < LIGHT_IX) ||  (type > DARK_IX)){
					return;
				}
				currentBrushType = type;
				updateContextStrokeStyle();
			}
			updateContextStrokeStyle = function (){
				
				var strokeStyle = getCurrent();
				darkCanvasContext.strokeStyle = strokeStyle.dark;
				dimCanvasContext.strokeStyle = strokeStyle.dim;
				darkCanvasContext.fillStyle = strokeStyle.dark;
				dimCanvasContext.fillStyle = strokeStyle.dim;
			},
			fogMap = function(width,height){
				updateContextStrokeStyle();
				var currCtx = getBrushContext();
				
				currCtx.save();
				currCtx.fillRect(0, 0, width, height);
				currCtx.restore();
			},
			
			clearMap = function(width,height){
				
				dimCanvasContext.save();
				darkCanvasContext.save();
				//change the brush to light temporarily
				
				var fillStyle = getPattern(LIGHT_IX);
				dimCanvasContext.fillStyle = fillStyle.dim;
				darkCanvasContext.fillStyle = fillStyle.dark;
				dimCanvasContext.fillRect(0, 0, width, height);
				darkCanvasContext.fillRect(0, 0, width, height);
				
				//reset to old brush
				fillStyle = getCurrent();
				
				darkCanvasContext.restore();
				dimCanvasContext.restore();
			},
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
            },
			getCurrentBrush = function () {
                return brushTypes[currentBrushType];
            },
			getDarkIx = function(){
				return DARK_IX;
			},
			getDimIx = function(){
				return DIM_IX;
			},
			getLightIx = function(){
				return LIGHT_IX;
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
			clearMap: clearMap,
			getDarkIx: getDarkIx,
			getDimIx: getDimIx,
			getLightIx: getLightIx
        }
    };
});