require(['common'], function(common) {
    console.log('dm-app.js running');

    //refactor this later
    require(['map', 'jquery', 'dropzone', 'settings'], function(map, jquery, Dropzone, settings) {
        var $ = jquery,
            mapWrapper = document.getElementById('map-wrapper'),
			loadedNewMap = false,
			newMapSet = false,
            dmMap = map();
      /*  socket.on('testClient2', function (msg) {
	   console.log('helloworld!');
	});*/
        $('#upload').addClass('dropzone').dropzone({
            url: '/upload',
            dictDefaultMessage: 'Click here or drag and drop an image to upload',
            acceptedFiles: 'image/*', 
            init: function() {
                this.on('addedfile', function(file) { 
                  console.log('added file'); 
                });
                
                this.on('complete', function (file) {
                    console.log('complete');
                    this.removeFile(file);
                    checkForMapUpload();
                });
            }
        });
        
        function checkForMapUpload() {
          var jqxhr = $.get(settings.mapImage, function() {
              console.log( 'success' );
              createTheMap();
          }).fail(function() {
              console.log('failure');
          });
        }
        
        checkForMapUpload();
        
		function enableLoadingScreen(){
				document.getElementById("loading_screen").setAttribute('class',"modal");
		}
			
		function disableLoadingScreen(){
			document.getElementById("loading_screen").removeAttribute('class');
		}
		
		function setSendIconGreen(){
			document.getElementById("icon-send-state").setAttribute('class',"green_dot");
		}
		
        function createTheMap() {
			enableLoadingScreen();
            $('#upload').hide();
            dmMap.create(mapWrapper, {
                callback: function() {
					//add prompt on page-unload (refresh/close window)
					window.onbeforeunload = function (e) {
						
						//save labels just incase app exits
						dmMap.saveAllLabels();
						
						e = e || window.event;

						// For IE and Firefox prior to version 4
						if (e) {
							e.returnValue = 'Sure?';
						}

						// For Safari
						return 'Sure?';
						
					};
                    dmMap.fitMapToWindow();
                    window.addEventListener('resize', function(event) {
                        dmMap.fitMapToWindow();
                    });
					dmMap.loadAllLabels();
                },
                error: function() {
                  console.error('error creating map');
                }
            });
			
			if(loadedNewMap == true){
				window.onbeforeunload = undefined;
				location.reload();
			}
			
			disableLoadingScreen();
        }
        
        
            
        $('#btn-new-map').click(function() {
			if(confirm("Are you sure you want a new map (you will lose all fog-of-war and labels on current map)?")!=1){
				return
			}
			loadedNewMap=true;
			dmMap.saveAllLabels();
			dmMap.remove();
			$('#upload').show();
        });
		
        
	
	$('#btn-send').click(function () {
			
			enableLoadingScreen();
			setTimeout(function() {
				
				
			dmMap.createRender2();
			
            var imageData = document.getElementById('render').src;

            var jqxhr = $.post('/send',
                {
                    'imageData': imageData
                },
                function (e) {
                })
                .done(function (e) {
                })
                .fail(function (e) {
                })
                .always(function (e) {
					disableLoadingScreen();
					setSendIconGreen();
                    if (e.success) {
                        console.log(e.responseText);
                    } else {
                        console.error(e.responseText);
                    }
                });
        },0);
		});

    });

});
