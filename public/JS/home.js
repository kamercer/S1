$(function(){
    init();
    
    function init(){
        $("#uploadPic").click(function(){
            submitPic();
        });
    
        $("#setLocation").click(function(){
            openSetLocation();
        });

        $("#newOrgCreateButton").click(function(){
            $("#createNewOrgModal").modal('show');
        })
    }
    
    function submitPic(){
        var data = new FormData();
        
        data.append('image', $("#profilePic")[0].files[0]);
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'changeProfilePic' : '/changeProfilePic'), 'POST', data, false, null); 
    }

    function openSetLocation(){
        if(setLocationOpen === false){
            $("#setLocation").after("<div class=\"ui input\" id=\"setLocationInput\"><input class=\"ui input\" id=\"autocomplete\" onFocus=\"geolocate()\" type=\"text\"></input></div>");
            setLocationOpen = true;
            initAutocomplete();
        }   
    }
});

    var autocomplete;
    var setLocationOpen = false;

    function initAutocomplete() {
        // Create the autocomplete object, restricting the search to geographical
        // location types.
        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById('autocomplete')),
            {types: ['geocode']});

        autocomplete.addListener('place_changed', function(){
            //sometimes an address might not return coordinates such as "5200 U.S. 70, Mebane, NC, United States".  I need to handle this case
            var data = {};
            data.address = autocomplete.getPlace().formatted_address;
            data.lat = autocomplete.getPlace().geometry.location.lat();
            data.lng = autocomplete.getPlace().geometry.location.lng();

            ajaxCall("setLocation", "POST", JSON.stringify(data), "application/json", setLocationCompletion);
        });
    }

    function setLocationCompletion(data){
        if(data === "OK"){
            $("#setLocationInput").remove();
            setLocationOpen = false;
        }
    }

    function geolocate() {
       if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var geolocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            var circle = new google.maps.Circle({
              center: geolocation,
              radius: position.coords.accuracy
            });
            autocomplete.setBounds(circle.getBounds());
          });
        }
      }

var ajaxCall = function(url, type, data, cType,callbackSuccess){
    $.ajax({
        url: url,
        type: type,
        data : data,
        contentType : cType,
        processData: false,
        success: function(result){
            console.log(url + ' success');
            if (callbackSuccess != null){
                callbackSuccess(result);
            }
         },
         error: function(data){
            console.log(url + " err: " + data);
         }
    });
}