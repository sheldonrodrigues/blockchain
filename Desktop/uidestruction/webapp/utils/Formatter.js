sap.ui.define([], function () {
    "use strict";

    return {

        //Function for setting processing mode from i18n
        formatProcessingMode: function (response) {
			if (response) {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("TEST_MODE");
			} else {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("PRODUCTION_MODE");
			}
        },

        getListItemType : function(response){

           var status = response.toLowerCase();
           if(status == "completed")
            {
            return "Navigation";
            }
            else if (status == "partially_completed" || status == "partially completed")
            {
            return "Navigation";
            }
            else if (status == "failed")
            {
            return "Navigation";
            }
            else
            {
            return "Inactive"
            }
        },

        // Function for color of status
        formatRunStatus: function (response) {

            var status = response.toLowerCase();
         

            if (status == "completed") {
                return sap.ui.core.ValueState.Success;
            }
            else if (status == "failed") {
                return sap.ui.core.ValueState.Error;
            }
            else if (status == "in progress" || status == "in_progress") {
                return sap.ui.core.ValueState.Warning;
            }
        },

        // Function to display status from All CAPS format to normal format ( COMPLETED -> Completed)
        formatRunText: function (response) {

            var statusText = response.toLowerCase();

			if (statusText == "completed") {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("COMPLETED");

			} else if (statusText == "partially_completed" || statusText == "partially completed") {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("PARTIALLY_COMPLETED");

			} else if (statusText == "in_progress" || statusText == "in progress") {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("IN_PROGRESS");

			} else if (statusText == "failed") {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("FAILED");

			} else if (statusText == "new") {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("NEW");
			} else {
				return response;
			}

        },

        //Function for formatting date
        //Input -> 2020-06-22T04:23:10.248+0000, Output-> Jun 06 ,2020
        formatDate: function (date) {
            date = date.split("+")[0];
            var jsDate = new Date(date);

            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({style:'medium' }); 
            return dateFormat.format(jsDate);
        },

        formatDateFromMillis: function(date){
            var jsDate = new Date(date);
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({style:'medium' }); 
            return dateFormat.format(jsDate);
        }

    };

});