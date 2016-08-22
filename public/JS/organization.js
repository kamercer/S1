$(function () {

    init();
    var activeEventEdit;

    function init() {

        $(".ui.checkbox").checkbox();

        $("#join").click(function () {
            var callback = function (result) {
                location.reload();
            };

            ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'join' : '/join'), 'Post', null, null, callback);
        });


        $(document).ready(function () {
            $("#orgUpdateImg").click(function () {
                $("#imageModal").modal('show');
            });
        });

        $("#uploadPic").click(function () {
            submitPic();
        });

        $("#createEvent").click(function () {
            initAutocomplete('autocomplete');
            $("#newEventModal").modal('show');
            $(".ui.calendar").calendar();
        });

        $("table tr").click(function (event) {
            $("#userImg").attr('src', '/userImage/' + event.currentTarget.id);

            ajaxCall(window.location.href + 'userInfo/' + event.currentTarget.id, 'Get', null, null, function (data) { return loadUserData(data, event.currentTarget.id); });
        });

        $("#eventMenu .ui.simple.dropdown").click(function (event) {

            activeEventEdit = event.currentTarget.id;

            if (event.target.id === "edit") {
                $("#eventImgEdit").attr('src', '/eventImage/' + event.currentTarget.id);
                ajaxCall('/eventInfo/' + event.currentTarget.id, 'Get', null, null, loadEditEventData);
            } else if (event.target.id === "view") {
                ajaxCall('/eventViewInfo/' + event.currentTarget.id, 'GET', null, null, detailedView);
            } else if (event.target.id === "RSVP") {
                submitRSVP(event);
            } else {
                ajaxCall('/eventInfo/' + event.currentTarget.id, 'Get', null, null, function (data) { return loadEventData(data, event); });
            }
        });


        $("#submitEvent").click(function () {
            submitEvent();
        });

        $("#eventEditSubmit").click(function (event) {
            editEventSubmit(event);
        });

        $("#orgSettings").click(function () {
            ajaxCall('orgSettingsInfo', 'Get', null, null, loadSettingsInfo);
        });

        //changeJoinOption
        $("#joinOption").change(function () {
            ajaxCall('changeJoinOption/' + $("#joinOption").prop("checked"), 'POST', null, null, null);
        });

        $("#joinCheck").click(function () {
            ajaxCall('getApplications', 'GET', null, null, loadApplicationData);
        });
    }

    var submitEvent = function () {

        $("#newEventModal .message").remove();

        var data = new FormData();

        var errorCheck = false;
        if ($("#name").val() === "") {
            $("#name").parent().append("<div class=\"ui red message\"><div class=\"header\">Error</div><p>Event Name cannot be blank</p></div>");
            errorCheck = true;
        }

        if ($("#sDate").val() === "") {
            $("#sDate").parent().append("<div class=\"ui red message\"><div class=\"header\">Error</div><p>Start Date cannot be blank</p></div>");
            errorCheck = true;
        }

        if ($("#eDate").val() === "") {
            $("#eDate").parent().append("<div class=\"ui red message\"><div class=\"header\">Error</div><p>End Date cannot be blank</p></div>");
            errorCheck = true;
        }

        if (errorCheck) {
            $("#newEventModal").modal('refresh');
            return;
        }

        data.append("name", $("#name").val());

        if ($("#description").val() !== "") {
            data.append("description", $("#description").val());
        }

        if (autocomplete.getPlace()) {
            data.append("address", autocomplete.getPlace().formatted_address);
            data.append("lat", autocomplete.getPlace().geometry.location.lat());
            data.append("lng", autocomplete.getPlace().geometry.location.lng());
        }
        data.append("sDate", $("#sDate").val());
        data.append("eDate", $("#eDate").val());
        data.append("image", $("#eventPhoto")[0].files[0]);
        data.append("public", $("#public").prop("checked"));

        ajaxCall('createEvent', 'POST', data, false, function (data) {
            if (data !== "OK") {
                $("#submitEvent").append("<div class=\"ui red message\"><div class=\"header\">Error</div><p>Error Creating Event</p></div>");
            } else {
                location.reload();
            }
        });
    };

    function submitRSVP(event) {
        ajaxCall('/RSVP/' + event.currentTarget.id, 'POST', null, 'application/json', function (data) { console.log(data); });
    }

    function viewDetails(event) {
        $("#eventImage").attr('src', "/events/eventImage/" + event.id);

        $("#detailModal").modal('show');
    }

    function submitPic() {
        var data = new FormData();

        data.append('image', $("#organizationProfileImage")[0].files[0]);

        ajaxCall(window.location.href + ((window.location.href.endsWith('/')) ? 'changeOrganizationImage' : '/changeOrganizationImage'), 'POST', data, false, null);
    }

    function loadUserData(data, id) {

        $("#userName").text(data.first + " " + data.last);
        $("#userEmail").text(data.email);

        if(data.hours !== null){
            $("#userHours").text(data.hours);
        }
        

        if (data.status === 0) {
            $("#statusMenu").html("<div class=\"item\" name=\"1\">Make Admin</div><div class=\"item\" name=\"0\">Remove Member</div>")
        } else {
            $("#statusMenu").html("<div class=\"item\" name=t\"2\">Make Member</div><div class=\"item\" name=\"0\">Remove Member</div>")
        }

        $(".ui.selection.dropdown").dropdown({
            onChange: function (value, text, $selectedItem) {
                $("#statusChangeConfirmation .description").html("Are you sure you want to change the status of " + $("#userName").text());

                $("#statusConfirmed").click(function () {

                    var input = {};
                    input.selectedOption = $("#statusMenu .active").attr('name');
                    input.user_id = id;

                    ajaxCall(window.location.href + "changeUserStatus", 'POST', JSON.stringify(input), 'application/json', function(data){
                        console.log(data);
                        if(data === 200){
                            location.reload();
                        }
                    });
                });

                $("#statusChangeConfirmation").modal('show');
            }
        });

        $('#memberInfoModal').modal('show');
    }

    function loadEventData(data, event) {
        $("#eventName").text("");
        $("#eventDescription").text("");
        $("#eventTime").text("");
        $("#eventLocation").text("");

        $("#eventName").text(data.name);
        if (data.description) {
            $("#eventDescription").text(data.description);
        } else {
            $("#eventDescription").text("(not provided)");
        }
        if (data.location) {
            $("#eventLocation").text(data.location);
        } else {
            $("#eventLocation").text("(not provided)");
        }

        var sDate = new Date(data.startDate);
        sDate = sDate.toDateString() + " at " + sDate.toTimeString().substr(0, 5);

        var eDate = new Date(data.endDate);
        eDate = eDate.toDateString() + " at " + eDate.toTimeString().substr(0, 5);

        $("#eventTime").text(sDate + " - " + eDate);

        if (data.photo) {
            $("#eventImg").attr('src', '/eventImage/' + event.currentTarget.id);
        }

        $("#eventInfoModal").modal('show');
    }

    function loadEditEventData(data) {
        $("#eventNameInput").val("");
        $("#eventDescriptionInput").val("");
        $("#eventStartInput").val("");
        $("#eventEndInput").val("");
        $("#autocompleteEdit").val("");

        $("#eventNameInput").val(data.name);
        $("#eventDescriptionInput").val(data.description);
        
        var d = new Date(data.startDate);
        $("#eventStartInput").val(data.startDate);
        $("#eventEndInput").val(data.endDate);
        $("#autocompleteEdit").val(data.location);

        initAutocomplete('autocompleteEdit');

        $("#eventEditModal").modal('show');

        $("#eventEditModal .ui.calendar").calendar();
    }

    function editEventSubmit(event) {

        if ($("#newEventImage")[0].files.length > 0) {
            var data = new FormData();
            data.append('image', $("#newEventImage")[0].files[0]);
            ajaxCall('/changeEventImage/' + activeEventEdit, 'POST', data, false, null);
        }

        var data = {};
        data.name = $("#eventNameInput").val();
        data.description = $("#eventDescriptionInput").val();
        data.startDate = $("#eventStartInput").val();
        data.endDate = $("#eventEndInput").val();
        if (addressSelected) {
            data.address = autocomplete.getPlace().formatted_address;
            data.lat = autocomplete.getPlace().geometry.location.lat();
            data.lng = autocomplete.getPlace().geometry.location.lng();
            addressSelected = false;
        }

        ajaxCall('/eventEdit/' + activeEventEdit, 'POST', JSON.stringify(data), 'application/json', null);
    }

    function detailedView(data) {
        data.forEach(function (element, index) {
            $("#eventViewModal table tbody").html("<tr id=\"" + element.user._id + "\">" +
                "<td>" +
                index +
                "</td>" +
                "<td>" +
                element.user.first_name +
                "</td>" +
                "<td>" + 
                "<div class=\"ui calendar\"><div class=\"ui input left icon signIn\"><i class=\"calendar icon\"></i><input type=\"text\" value=\"" + ((element.signIn) ? element.signIn : "") + "\"></div></div>" + 
                "</td>" +
                "<td>" +
                "<div class=\"ui calendar\"><div class=\"ui input left icon signOut\"><i class=\"calendar icon\"></i><input value=\"" + ((element.signOut) ? element.signOut : "") + "\"></div></div>" +  
                "</td>" +
                "</tr>");
        }, this);



        $("#eventViewModal").modal('show');

        
        $(".signIn input").focus(function(event){

            console.log(event);

            $(".signIn input").blur(function (event) {
                signInEdit(event);
            }); 
        });

        $(".signOut input").blur(function (event) {
            signOutEdit(event);
        });

        $("#eventViewModal .ui.calendar").calendar();
    }

    function signInEdit(event) {
        var data = {};
        data.user = event.target.parentNode.parentNode.parentNode.parentNode.id;
        data.event = activeEventEdit;
        data.signIn = $(event.target).val();

        ajaxCall('/eventDetailEdit', 'POST', JSON.stringify(data), 'application/json', null);
    }

    function signOutEdit(event) {
        var data = {};
        data.user = event.target.parentNode.parentNode.parentNode.parentNode.id;
        data.event = activeEventEdit;
        data.signOut = $(event.target).val();

        ajaxCall('/eventDetailEdit', 'POST', JSON.stringify(data), 'application/json', null);
    }

    function loadSettingsInfo(data) {
        $("#settingsOrgName").val("");
        $("#settingsOrgNickname").val("");
        $("#individualGoal").val("");
        $("#organizationGoal").val("");
        $("#organizationSummary").val("");

        $("#settingsOrgName").val(data.name);
        $("#settingsOrgNickname").val(data.nickname);
        $("#individualGoal").val(data.individualServiceGoal);
        $("#organizationGoal").val(data.OrganizationServiceGoal);
        $("#organizationSummary").val(data.summary);

        $('#orgSettingsModal .ui.checkbox').checkbox();
        $("#orgSettingsModal").modal('show');
    }

    function loadApplicationData(data) {
        $("#joinCheckModal .list").append("");

        data.waitingUsers.forEach(function (element, index) {
            $("#joinCheckModal .list").append("<div class=\"item\" id=\"" + element._id + "\">" +
                "<div class=\"right floated content\">" + "<button class=\"ui button\">Add</button>" +
                "</div><div class=\"content\">" + element.first_name + " " + element.last_name +
                "</div></div>"
            );
        }, this);

        $("#joinCheckModal .list button").click(function (event) {
            ajaxCall("allowMember/" + event.currentTarget.parentNode.parentNode.id, "POST", null, null, null);
        });

        $("#joinCheckModal").modal('show');
    }


    var ajaxCall = function (url, type, data, cType, callbackSuccess) {
        $.ajax({
            url: url,
            type: type,
            data: data,
            contentType: cType,
            processData: false,
            success: function (result) {
                console.log(url + ' success');
                if (callbackSuccess != null) {
                    callbackSuccess(result);
                }
            },
            error: function (data) {
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
        { types: ['geocode'] });

    autocomplete.addListener('place_changed', function () {
        addressSelected = true;
    });
}

function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
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