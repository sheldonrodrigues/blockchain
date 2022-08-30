sap.ui.define([
], function() {
    'use strict';
    var BASE_URL = 'http://localhost:3001/players'
    
    return{
        REQUESTS_URL : BASE_URL + "/application/destruction/requests",
        CSRF_APPLICATION_URL: BASE_URL+"/application/csrfFetch",
        APPLICATION_GROUP_URL: BASE_URL + "/destruction/applicationGroups",
        REQUEST_IDS_URL : BASE_URL+ "/application/destruction/requests/ids",        
        LEGAL_GROUND_DETAILS_URL: BASE_URL+"/application/legalGrounds/",
        LEGAL_GROUND_DETAILS_VALUE_HELP_URL: BASE_URL+"/application/",
        DESTRUCTION_SCHEDULE_URL: BASE_URL+"/application/destruction"
    }

});