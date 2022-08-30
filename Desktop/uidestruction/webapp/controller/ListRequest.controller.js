sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    'sap/ui/core/Fragment',
    'sap/m/MessageBox',
    '../utils/Formatter'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,Fragment,MessageBox,Formatter) {
        "use strict";
    

        return Controller.extend("destruction.controller.ListRequest", {
            formatter: Formatter,
            onInit: function () {
             this.fetchuiData();
             this.makeCall();
            },




    fetchuiData:function(){
        var that=this;
        $.ajax({
            url : 'http://localhost:3001/players/list',
            type : "GET",
            dataType:"json",
            async:false,
            contentType:"application/json",
            success :function(oResponse) {
                if(oResponse){
                    that.oModel=new JSONModel(oResponse);
                    that.getView().setModel(that.oModel, "oListModel");
                    console.log( that.getView().getModel("oListModel").getData())
                }else{
                    MessageBox.error("Error");
                }
            },
            error:function(error){
                MessageBox.error(error);
            }

                
        });

    },

    
    makeCall: function () {
        var that=this;
        $.ajax({
            url : 'http://localhost:3001/players/filterdata',
            type : "GET",
            dataType:"json",
            async:false,
            contentType:"application/json",
            success :function(oResponse) {
                if(oResponse){
                    that.oModel=new JSONModel(oResponse);
                    that.getView().setModel(that.oModel, "oFilterModel");
                    console.log( that.getView().getModel("oFilterModel").getData())
                }else{
                    MessageBox.error("Error");
                }
            },
            error:function(error){
                MessageBox.error(error);
            }

                
        });
    },

    handleDestructionRunValueHelp: function () {
        var that = this;
        var oView = this.getView();

        if (!that.destructionIdSelectDialog) {

            Fragment.load({
                id: "listreportDestructionRunValueHelpDialog",
                name: "destruction.view.fragments.DestructionRunValueHelpDialog",
                controller: this
            }).then(function (oDialog) {

                that.destructionIdSelectDialog = oDialog;
                oView.addDependent(oDialog);
                oDialog.open();
                var selectDialog = Fragment.byId("listreportDestructionRunValueHelpDialog", "destructionRunValueHelpDialog");
            });
        } else {
            that.destructionIdSelectDialog.open();
        }
    },
    handleDestructionRunValueHelpClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem"),
            oInput = this.byId("destructionRunValueHelp");
            console.log(oSelectedItem);

        if (oSelectedItem) {
            oInput.setValue(oSelectedItem.getTitle());
        }

        if (!oSelectedItem) {
            oInput.resetProperty("value");
        }
    },
    //Create Button Pressed
    onCreateDestructionRequestPressed: function (oEvent) {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("CreateRequest");
    },

    //detail page
    handleListItemPress: function (oEvent) {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("request");
    },
    // Function for setting Table Count, will be called when data binding to table is done.
		onUpdateFinished: function (oEvent) {
			var sTitle,
				totalItems = oEvent.getParameter("total");
			var oTable = oEvent.getSource(),
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("DESTRUCTION_TABLE_HEADER");

			if (totalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("DESTRUCTION_TABLE_HEADER", [totalItems]);
			} else {
				sTitle = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("DESTRUCTION_TABLE_HEADER", [0]);
			}
			this.getView().byId("destructionTableHeader").setText(sTitle);
			oEvent.getSource().setShowOverlay(false);
			this.getView().setBusy(false);
		}


   
       });
        });
