$(function(){
    
    init();
    var activeEventEdit;
    
    function init(){

        //$(".ui.checkbox").checkbox();
        
        $("#join").click(function(){
            var callback = function(result){
                location.reload();
            }
            
            ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'join' : '/join')  , 'Post', null, null, callback);
        });
        

        $(document).ready(function(){
            $("#orgUpdateImg").click(function(){
                $("#imageModal").modal('show');
            });
        });

        $("#uploadPic").click(function(){
            submitPic();
        });

        $("#createEvent").click(function(){
            initAutocomplete('autocomplete');
            $("#newEventModal").modal('show');
        });

        $("table tr").click(function(event){
            $("#userImg").attr('src', '/userImage/' + event.currentTarget.id);

            ajaxCall(window.location.href + 'userInfo/' + event.currentTarget.id, 'Get', null, null, function(data){ return loadUserData(data, event.currentTarget.id)});
        });

        $("#eventMenu .ui.simple.dropdown").click(function(event){

            activeEventEdit = event.currentTarget.id;

            //side button was pressed
            if(event.originalEvent.originalTarget.classList[0] === "item" || event.originalEvent.originalTarget.classList[0] === "edit"){

                if(event.originalEvent.originalTarget.id === "edit"){
                    $("#eventImgEdit").attr('src', '/eventImage/' + event.currentTarget.id);
                    ajaxCall('/eventInfo/' + event.currentTarget.id, 'Get', null, null, loadEditEventData);
                }else if(event.originalEvent.originalTarget.id === "view"){
                    ajaxCall('/eventViewInfo/' + event.currentTarget.id, 'GET', null, null, detailedView);
                }else if(event.originalEvent.originalTarget.id === "RSVP"){
                    submitRSVP(event);
                }
            }else{
                $("#eventImg").attr('src', '/eventImage/' + event.currentTarget.id);

                ajaxCall('/eventInfo/' + event.currentTarget.id, 'Get', null, null, loadEventData);
                $("#eventInfoModal").modal('show');
            }
        });


        $("#submitEvent").click(function(){
           submitEvent();
        });

        $("#eventEditSubmit").click(function(event){
            editEventSubmit(event);
        });

        $("#orgSettings").click(function(){
            ajaxCall('orgSettingsInfo', 'Get', null, null, loadSettingsInfo);
        });

        /*

        $(".Details").click(function(){
            viewDetails(this);
        });
        
        $(".Edit").click(function(){
           editEvent(this); 
        });


        $("#updateImage").click(function(){
            $("#imageModal").modal('show');
        });

        */
    }
    
    var submitEvent = function(){

        if(addressSelected === false){
            console.log("Address not selected");
            return;
        }

        var data = new FormData();
        data.append("name", $("#name").val());
        data.append("description", $("#description").val());
        data.append("address", autocomplete.getPlace().formatted_address);
        data.append("lat", autocomplete.getPlace().geometry.location.lat());
        data.append("lng",  autocomplete.getPlace().geometry.location.lng());
        data.append("sDate", $("#sDate").val());
        data.append("eDate", $("#eDate").val());
        data.append("image", $("#eventPhoto")[0].files[0]);
        data.append("public" ,$("#public").prop("checked"));
        
        ajaxCall('createEvent', 'POST', data, false, null); 
    };
    
    var submitRSVP = function(event){
        ajaxCall('/RSVP/' + event.currentTarget.id, 'POST', null, 'application/json', function(data) {console.log('yep')});
    }

    function viewDetails(event){
        $("#eventImage").attr('src', "/events/eventImage/" + event.id);

        $("#detailModal").modal('show');
    }

    function submitPic(){
        var data = new FormData();
        
        data.append('image', $("#organizationProfileImage")[0].files[0]);
        
        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'changeOrganizationImage' : '/changeOrganizationImage'), 'POST', data, false, null); 
    }

    function loadUserData(data, id){

        $("#userName").text(data.first + " " + data.last);
        $("#userEmail").text(data.email);
        $("#userHours").text(data.hours);

        if(data.status == 0){
            $("#statusMenu").html("<div class=\"item\" name=\"1\">Make Admin</div><div class=\"item\" name=\"0\">Remove Member</div>")
        }else{
            $("#statusMenu").html("<div class=\"item\" name=\"2\">Make Member</div><div class=\"item\" name=\"0\">Remove Member</div>")
        }

        $(".ui.selection.dropdown").dropdown({
            onChange: function(value, text, $selectedItem){
                $("#statusChangeConfirmation .description").html("Are you sure you want to change the status of " + $("#userName").text());

                $("#statusConfirmed").click(function(){

                    var input = {};
                    input.selectedOption = $("#statusMenu .active").attr('name');
                    input.user_id = id;

                    ajaxCall(window.location.href + "changeUserStatus", 'POST', JSON.stringify(input), 'application/json', null); 
                });

                $("#statusChangeConfirmation").modal('show');
            }
        });

        $('#memberInfoModal').modal('show');
    }

    function loadEventData(data){
        $("#eventName").text("");
        $("#eventDescription").text("");
        $("#eventTime").text("");
        $("#eventLocation").text("");

        $("#eventName").text(data.name);
        $("#eventDescription").text(data.description);
        $("#eventTime").text(data.time);
        $("#eventLocation").text(data.location);
    }

    function loadEditEventData(data){
        $("#eventNameInput").val("");
        $("#eventDescriptionInput").val("");
        $("#eventStartInput").val("");
        $("#eventEndInput").val("");
        $("#autocompleteEdit").val("");

        $("#eventNameInput").val(data.name);
        $("#eventDescriptionInput").val(data.description);
        $("#eventStartInput").val(data.startDate);
        $("#eventEndInput").val(data.endDate);
        $("#autocompleteEdit").val(data.location);

        initAutocomplete('autocompleteEdit');

        $("#eventEditModal").modal('show');
    }

    function editEventSubmit(event){

        if($("#newEventImage")[0].files.length > 0){
            var data = new FormData();
            data.append('image', $("#newEventImage")[0].files[0]);
            ajaxCall('/changeEventImage/' + activeEventEdit, 'POST', data, false, null);
        }

        var data = {};
        data.name = $("#eventNameInput").val();
        data.description = $("#eventDescriptionInput").val();
        data.startDate = $("#eventStartInput").val();
        data.endDate = $("#eventEndInput").val();
        if(addressSelected){
            data.address = autocomplete.getPlace().formatted_address;
            data.lat = autocomplete.getPlace().geometry.location.lat();
            data.lng = autocomplete.getPlace().geometry.location.lng();
            addressSelected = false;
        }

        ajaxCall('/eventEdit/' + activeEventEdit, 'POST', JSON.stringify(data), 'application/json', null);
    }

    function detailedView(data){
        data.forEach(function(element, index) {
            $("#eventViewModal table tbody").html("<tr id=\"" + element.user._id + "\">" + 
                "<td>" + 
                    index + 
                "</td>" + 
                "<td>" +
                    element.user.first_name + 
                "</td>" + 
                "<td><div class=\"ui input signIn\"><input value=\"" + ((element.signIn) ? element.signIn : "") + 
                "\"></div></td>" + 
                "<td><div class=\"ui input signOut\"><input value=\"" + ((element.signOut) ? element.signOut : "") + 
                "\"></div></td>" + 
            "</tr>")
        }, this);

        $(".signIn").change(function(event){
            signInEdit(event);
        });

        $(".signOut").change(function(event){
            signOutEdit(event);
        });

        $("#eventViewModal").modal('show');
    }

    function signInEdit(event){
        var data = {};
        data.user = event.currentTarget.parentNode.parentNode.id;
        data.event = activeEventEdit;
        data.signIn = $(event.target).val();

        ajaxCall('/eventDetailEdit', 'POST', JSON.stringify(data), 'application/json', null);
    }

    function signOutEdit(event){
        var data = {};
        data.user = event.currentTarget.parentNode.parentNode.id;
        data.event = activeEventEdit;
        data.signOut = $(event.target).val();

        ajaxCall('/eventDetailEdit', 'POST', JSON.stringify(data), 'application/json', null);
    }

    function loadSettingsInfo(data){
        $("#settingsOrgName").val("");
        $("#settingsOrgNickname").val("");
        $("#individualGoal").val("");
        $("#organizationGoal").val("");

        $("#settingsOrgName").val(data.name);
        $("#settingsOrgNickname").val(data.nickname);
        $("#individualGoal").val(data.individualServiceGoal);
        $("#organizationGoal").val(data.OrganizationServiceGoal);

        $('#orgSettingsModal .ui.checkbox').checkbox();

        $("#orgSettingsModal").modal('show');
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
});

    var autocomplete;
    var addressSelected = false;


    function initAutocomplete(id) {
        // Create the autocomplete object, restricting the search to geographical
        // location types.
        autocomplete = new google.maps.places.Autocomplete(
            /** @type {!HTMLInputElement} */(document.getElementById(id)),
            {types: ['geocode']});

        autocomplete.addListener('place_changed', function(){
            addressSelected = true;
        });
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