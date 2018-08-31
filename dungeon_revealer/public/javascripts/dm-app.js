require(['common'], function(common) {
    console.log('dm-app.js running');

    //refactor this later
    require(['map', 'jquery', 'dropzone', 'settings'], function(map, jquery, Dropzone, settings) {
        var $ = jquery,
            mapWrapper = document.getElementById('map-wrapper'),
			loadedNewMap = false,
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
			
        function createTheMap() {
			enableLoadingScreen();
            $('#upload').hide();
            dmMap.create(mapWrapper, {
                callback: function() {
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
				location.reload();
			}
			
			disableLoadingScreen();
        }
        
        
            
        $('#btn-new-map').click(function() {
			loadedNewMap=true;
			dmMap.saveAllLabels();
			dmMap.remove();
			$('#upload').show();
        });
        
	
	$('#btn-send').click(function () {
		enableLoadingScreen();
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
                    if (e.success) {
                        console.log(e.responseText);
                    } else {
                        console.error(e.responseText);
                    }
                });
        });

    });

});
