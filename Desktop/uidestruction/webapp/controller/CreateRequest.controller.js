sap.ui.define([
    'sap/ui/core/mvc/Controller',
    "sap/ui/model/resource/ResourceModel",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    "../utils/Constants",
    'sap/ui/model/FilterOperator',
    "sap/m/MessageToast"
], function(Controller,ResourceModel,JSONModel,MessageBox,Fragment,Filter,Constants,FilterOperator,MessageToast){
    "use strict";
    const DATATYPE_INTEGER = "Integer";
    const DATATYPE_DECIMAL = "Decimal";
    const DATATYPE_STRING = "String";
    const DATATYPE_BOOLEAN = "Boolean";
    const DATATYPE_TIMESTAMP = "Timestamp";
    return Controller.extend("destruction.controller.CreateRequest",{

        onInit:function(){
            var that = this;
            //TODO
            var i18nModel = new ResourceModel({
                bundleName: "destruction.i18n.i18n"
            });
            this.getView().setModel(i18nModel, "i18n")
            var oCreatePageRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oCreatePageRouter.getRoute("CreateRequest").attachMatched(function(oEvent) {
                var selectionCriteriaSubsection = that.getView().byId("selectionCriteriaSubsection");
                selectionCriteriaSubsection.removeAllSubSections();
                that.getView().byId("messagePopoverButton").setVisible(false);
                that.getView().byId("applicationValueHelpInput").setValue("");
                that.generateInitialSelectionCriteriaSubsection(selectionCriteriaSubsection);
                that.initializeDataModels();
            });


            
        },
         // generates a message strip initially in the selection criteria section 
         generateInitialSelectionCriteriaSubsection: function(selectionCriteriaSubsection) {
            var selectionCriteriaInitialMessageSubSection = new sap.uxap.ObjectPageSubSection();
            var selectionCriteriaMesageStrip = new sap.m.MessageStrip({
                text: "{i18n>CREATE_PAGE_SELECTION_CRITERIA_MESSAGE_STRIP}",
                type: "Information",
                showIcon: true
            });
            selectionCriteriaInitialMessageSubSection.addBlock(selectionCriteriaMesageStrip);
            selectionCriteriaSubsection.addSubSection(selectionCriteriaInitialMessageSubSection);
        },
         /*Function initializes the data models to be used in the oView
        1)Model for application groups
        2)Model for destructionrequest payload*/


        initializeDataModels: function() {
            var oView = this.getView();
            var applicationGroupModel = new JSONModel({
                applicationGroups: []
            });
            oView.setModel(applicationGroupModel, "applicationGroupModel");
            var errorMessageModel = new JSONModel();
            oView.setModel(errorMessageModel, "errorMessageModel");
        },
         /*gets triggered when the cancel button is pressed a
          Confirmation message box is displayed
          stays on the same page in case user selects no
          navigates to the master page in case user selects yes*/
          onDestructionRunCancel: function() {
            var that = this;           
            MessageBox.confirm(this.getView().getModel("i18n").getProperty("DESTRUCTION_CANCEL_CONFIRMATION_MESSAGE"), {
                actions: [this.getView().getModel("i18n").getProperty("DESTRUCTION_CANCEL_BUTTON_TEXT_YES"), this.getView().getModel("i18n").getProperty("DESTRUCTION_CANCEL_BUTTON_TEXT_NO")],
                initialFocus: this.getView().getModel("i18n").getProperty("DESTRUCTION_CANCEL_BUTTON_TEXT_YES"),
                emphasizedAction: null,
                onClose: function (oAction) {
                    if (oAction === that.getView().getModel("i18n").getProperty("DESTRUCTION_CANCEL_BUTTON_TEXT_YES")) {
                            var oRouterMasterPage = sap.ui.core.UIComponent.getRouterFor(that);
                            oRouterMasterPage.navTo("RouteView1");                        
                    }                
                }
            });
        },
        //Backend call to fetch ApplicationGroup details
        fetchApplicationGroupList: function() {
            var that=this;
            $.ajax({
                url : 'http://localhost:3001/players/createpagedata',
                type : "GET",
                dataType:"json",
                async:false,
                contentType:"application/json",
                success :function(oResponse) {
                    if(oResponse){
                        that.oModel=new JSONModel(oResponse);
                        that.getView().setModel(that.oModel, "oFilterModel1");
                        console.log( that.getView().getModel("oFilterModel1").getData())
                    }else{
                        MessageBox.error("Error");
                    }
                },
                error:function(error){
                    MessageBox.error(error);
                }
    
                    
            });
        },

        onApplicationValueHelpRequested: function() {
            var that = this;
            sap.ui.core.BusyIndicator.show();
            this.fetchApplicationGroupList();
                sap.ui.core.BusyIndicator.hide();
                // that.getView().getModel("applicationGroupModel").setProperty("/applicationGroups", applicationGroup);
                if (!that.oApplicationValueHelpDialog) {
                    Fragment.load({
                        name: "destruction.view.fragments.ApplicationGroupValueHelpDialog",
                        controller: that
                    }).then(function(oApplicationValueHelpDialog) {
                        that.oApplicationValueHelpDialog = oApplicationValueHelpDialog;
                        that.getView().addDependent(that.oApplicationValueHelpDialog);
                        that.oApplicationValueHelpDialog.setModel(that.getView().getModel("oFilterModel1"));
                        that.oApplicationValueHelpDialog.open();
                    }.bind(that));
                } else {
                    that.oApplicationValueHelpDialog.setModel(that.getView().getModel("oFilterModel1"));
                    that.oApplicationValueHelpDialog.open();
                }
            
        },
        /*triggered on selection of any application group from the value
        help dialog the selected value is displayed in the input and
        the diglog closes*/
        handleApplicationValueHelpSelect: function(oEvent) {
            var that = this;
            this.getView().byId("messagePopoverButton").setVisible(false);
            var oSelectedApplication = oEvent.getParameter("selectedItem");
            console.log(oSelectedApplication);
            this.selectedApplicationName = oSelectedApplication.getTitle();
            var selectedApplicationGroupPath = oEvent.getParameter("selectedItem").getBindingContext("oFilterModel1").sPath;
            var isSimulationSupportedForDestruction = this.getView().getModel("oFilterModel1").getProperty(selectedApplicationGroupPath).simulationSupportedForDestruction;
            console.log(isSimulationSupportedForDestruction);
            if ((isSimulationSupportedForDestruction === undefined) | (isSimulationSupportedForDestruction === "")) {
                isSimulationSupportedForDestruction = true
            }
            this.byId("applicationValueHelpInput").setValue(oSelectedApplication.getDescription());
            this.byId("applicationValueHelpInput").setValueState(sap.ui.core.ValueState.None);
            this.addLegalGroundDetails(oSelectedApplication.getTitle(), isSimulationSupportedForDestruction);
        },

        /*triggered when user searches in the application group value help dialog
        search field it searches if the search string is present as a substring
        in any of the application group names listed out*/
        handleApplicationValueHelpSearch: function(oEvent) {
            var searchString = oEvent.getParameter("value");
            var oFilter = new Filter("applicationGroupName", FilterOperator.Contains, searchString);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
         /*Retrieves the legal ground details data and calls generateLegalGroundDetails() 
        to generate the legal ground subsections*/
        addLegalGroundDetails: function(selectedApplicationGroupName, isSimulationSupportedForDestruction) {
            var that = this;
            sap.ui.core.BusyIndicator.show();
            let oPromise = this.fetchLegalGroundDetails(selectedApplicationGroupName);
            console.log(oPromise)
            oPromise.then(function (LegalGroundDetailList) {

                if (LegalGroundDetailList) {
                    sap.ui.core.BusyIndicator.hide();
                    that.generateLegalGroundDetails(LegalGroundDetailList.data, isSimulationSupportedForDestruction)
                 }

            }.bind(this)).catch(function (error) {

                console.log(error)

                }.bind(this)

            );
            // this.fetchLegalGroundDetails(selectedApplicationGroupName).then(function(LegalGroundDetailList) {
            //     sap.ui.core.BusyIndicator.hide();
            //     that.generateLegalGroundDetails(LegalGroundDetailList.data, isSimulationSupportedForDestruction)
            // }).catch(function(err) {
            //     that.generateErrorMessage();
            // });
        },

         /*Backend call to fetch the legal Ground details
          parameters passed:
           1) applicationGroupName - name of the selected application Group
          returns: the legal ground details for the selected application*/
          fetchLegalGroundDetails: function(applicationGroupName) {
    
            var that =this;
           return new Promise((resolve,reject) => { 
            $.ajax({
                url : 'http://localhost:3001/players/'+that.selectedApplicationName,
                type : "GET",
                dataType:"json",
                async:false,
                contentType:"application/json",
                success :function(oResponse) {
                    if(oResponse){
                        that.oModel=new JSONModel(oResponse);
                        that.getView().setModel(that.oModel, "oFilterModel2");
                        console.log( that.getView().getModel("oFilterModel2").getData())
                        resolve(oResponse);
                        
                    }else{
                        MessageBox.error("Error");
                    }
                },
                error:function(error){
                    reject(MessageBox.error(error));
                }
    
                    
            });
        })
        },
        /*function generates the subsections corressponding to each legal ground and the 
        controls within each subsection corressponding to the legal ground details
        parameters: 
         1) legalGroundDetails - legalGround details data obtained from API
         2) selectedApplicationName - name of the application group that has been selected by the user
         3) isSimulationSupportedForArchive - boolean value which indicates if simulation is supported for Archive
         customData:
         1) legalGroundName - used to retrieve the legal ground name to be passed to the payload later on
                              should be the same as the actual name and not display name
         2) selectionCriteriaName - used to retrieve the legal ground detail name to be passed to the payload later on
                                    should be the same as the actual name and not display name*/
                                    generateLegalGroundDetails: function(legalGroundDetails, isSimulationSupportedForArchive) {
                                        var that = this;
                                        this.legalGroundsWithNoSelectionCriteria = [];
                                        var legalGroundDetailsForm;
                                        var selectionCriteriaSubsection = this.getView().byId("selectionCriteriaSubsection");
                                        selectionCriteriaSubsection.removeAllSubSections();
                                        console.log( legalGroundDetails);
                                        legalGroundDetails.forEach(function(legalGround) {
                                            var legalGroundName;
                                            var legalGroundSubsection;
                                            var legalGroundSelectionCriteria = legalGround.selectionCriteria
                                            // Hiding the legal grounds which do not have selection criteria from the create page
                                            if(legalGroundSelectionCriteria && legalGroundSelectionCriteria.length > 0) {
                                                if ((legalGround.legalGroundDescription !== null) && (legalGround.legalGroundDescription !== "")) {
                                                    legalGroundName = legalGround.legalGroundDescription;
                                                } else {
                                                    legalGroundName = legalGround.legalGroundName;
                                                }
                                                legalGroundSubsection = new sap.uxap.ObjectPageSubSection({
                                                    title: legalGroundName
                                                }).addCustomData(new sap.ui.core.CustomData({
                                                    key: "legalGroundName",
                                                    value: legalGround.legalGroundName
                                                }));
                                                legalGroundDetailsForm = new sap.ui.layout.form.SimpleForm({
                                                    layout: "ResponsiveGridLayout",
                                                    singleContainerFullSize: true,
                                                    editable: true
                                                });
                                                legalGroundSelectionCriteria.forEach(function(selectionCriteria) {
                                                    var selectionCriteriaName;
                                                    if ((selectionCriteria.displayName !== null) && ((selectionCriteria.displayName !== ""))) {
                                                        selectionCriteriaName = selectionCriteria.displayName;
                                                    } else {
                                                        selectionCriteriaName = selectionCriteria.name;
                                                    }
                                                    var selectionCriteiaLabel = new sap.m.Label({
                                                        text: selectionCriteriaName,
                                                        layoutData: new sap.ui.layout.GridData({
                                                            span: "L2 M2 S4",
                                                            linebreak: true
                                                        }),
                                                    }).addCustomData(new sap.ui.core.CustomData({
                                                        key: "selectionCriteriaName",
                                                        value: selectionCriteria.name
                                                    }));
                                                    legalGroundDetailsForm.addContent(selectionCriteiaLabel);
                                                    that.generateSelectionCriteriaInputControl(legalGroundDetailsForm, selectionCriteria, legalGround.legalGroundName, selectionCriteriaName);
                                                });
                                                legalGroundSubsection.addBlock(legalGroundDetailsForm);
                                                selectionCriteriaSubsection.addSubSection(legalGroundSubsection);
                                            } else {
                                                that.legalGroundsWithNoSelectionCriteria.push(legalGround.legalGroundName);
                                            }
                                        });
                                        this.generateProcessingModeSection(selectionCriteriaSubsection, isSimulationSupportedForArchive);
                                    },
                                    /*checks for the data type of the legal ground detail and accordingly calls different functions to generate
         the appropriate control
         parameters:
         1) legalGroundDetailsForm - dynamically created form for each legal ground detail to which the corressponding
                                     controls would be added
         2) selectionCriteria - contains the data for each legal ground detail
         3) legalGroundName - name of the current legal ground that is being processed         
         4) selectionCriteriaName - name of the selection criteria (the legal ground detail)*/
        generateSelectionCriteriaInputControl: function(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName) {
            if ((selectionCriteria.type === DATATYPE_INTEGER) || (selectionCriteria.type === DATATYPE_DECIMAL)) {
                this.generateNumericValueHelpController(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName);
            } else if (selectionCriteria.type === DATATYPE_STRING) {
                this.generateStringValueHelpController(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName);
            } else if (selectionCriteria.type === DATATYPE_BOOLEAN) {
                this.generateBooleanSelectionController(legalGroundDetailsForm);
            } else if (selectionCriteria.type === DATATYPE_TIMESTAMP) {
                this.generateDateInputController(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName);
            }
        },
         /*Generates the value help control for String data type of the legal ground detail
         no need to consider range enabled for string
         parameters: same as the ones passed to generateSelectionCriteriaInputControl
         customData:
         1) legalGroundName : name of the current legal ground being processed
         2) valueHalpEndPoint : value help endpoint(encoded format) to fetch the legal ground details data          
         3) selectionCriteriaName : name of the current legal ground detail that is being processed*/
         generateStringValueHelpController: function(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName) {
            legalGroundDetailsForm.addContent(new sap.m.Input({
                showValueHelp: true,
                //valueHelpOnly: true, //todo
                type: "Text",
                valueHelpRequest: [this.onDynamicValueHelpRequested, this],
                liveChange: [this.onLiveUserInput, this],
                layoutData: [new sap.ui.layout.GridData({
                    span: "L4 M4 S4",
                    linebreak: false
                })],
            }).addCustomData(new sap.ui.core.CustomData({
                key: "legalGroundName",
                value: legalGroundName
            })).addCustomData(new sap.ui.core.CustomData({
                key: "valueHalpEndPoint",
                value: selectionCriteria.valueHelpEndPoint
            })).addCustomData(new sap.ui.core.CustomData({
                key: "selectionCriteriaName",
                value: selectionCriteriaName
            })));
        },
        /*Generates the value help control for numeric types like - integer and decimal
          considering whether range is enabled or not
          parameters: same as the ones passed to generateSelectionCriteriaInputControl
          customData:
          1) legalGroundName : name of the current legal ground being processed
          2) valueHalpEndPoint : value help endpoint(encoded format) to fetch the legal ground details data           
          3) selectionCriteriaName : name of the current legal ground detail that is being processed*/
        generateNumericValueHelpController: function(legalGroundDetailsForm, selectionCriteria, legalGroundName, selectionCriteriaName) {
            if (!(selectionCriteria.isRangeEnabled)) {
                legalGroundDetailsForm.addContent(
                    new sap.m.Input({
                        showValueHelp: true,
                        //valueHelpOnly: true, //TODO
                        type: "Number",
                        liveChange: [this.onLiveUserInput, this],
                        valueHelpRequest: [this.onDynamicValueHelpRequested, this],
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })]
                    }).addCustomData(new sap.ui.core.CustomData({
                        key: "legalGroundName",
                        value: legalGroundName
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "valueHalpEndPoint",
                        value: selectionCriteria.valueHelpEndPoint
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "selectionCriteriaName",
                        value: selectionCriteriaName
                    }))
                );
            } else {
                legalGroundDetailsForm.addContent(
                    new sap.m.Input({
                        showValueHelp: true,
                        //valueHelpOnly: true,
                        type: "Number",
                        placeholder: "{i18n>RANGE_ENABLED_PLACEHOLDER_FROM}",
                        liveChange: [this.onLiveUserInput, this],
                        valueHelpRequest: [this.onDynamicValueHelpRequested, this],
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })]
                    }).addCustomData(new sap.ui.core.CustomData({
                        key: "legalGroundName",
                        value: legalGroundName
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "valueHalpEndPoint",
                        value: selectionCriteria.valueHelpEndPoint
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "selectionCriteriaName",
                        value: selectionCriteriaName
                    }))
                );
                legalGroundDetailsForm.addContent(
                    new sap.m.Input({
                        showValueHelp: true,
                        //valueHelpOnly: true,
                        type: "Number",
                        placeholder: "{i18n>RANGE_ENABLED_PLACEHOLDER_TO}",
                        liveChange: [this.onLiveUserInput, this],
                        valueHelpRequest: [this.onDynamicValueHelpRequested, this],
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })]
                    }).addCustomData(new sap.ui.core.CustomData({
                        key: "legalGroundName",
                        value: legalGroundName
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "valueHalpEndPoint",
                        value: selectionCriteria.valueHelpEndPoint
                    })).addCustomData(new sap.ui.core.CustomData({
                        key: "selectionCriteriaName",
                        value: selectionCriteriaName
                    }))
                );
            }
        },
          /*Generates the boolean selection control for boolean data type of the legal ground detail
         parameters:
         1) legalGroundDetailsForm - dynamically created form for each legal ground detail to which the corressponding
                                     controls would be added*/
                                     generateBooleanSelectionController: function(legalGroundDetailsForm) {
                                        legalGroundDetailsForm.addContent(
                                            new sap.m.Select({
                                                items: [                       
                                                    new sap.ui.core.Item({
                                                        text: "{i18n>NONE}",
                                                        key: 1
                                                    }),                     
                                                    new sap.ui.core.Item({
                                                        text: "{i18n>TRUE}",
                                                        key: true
                                                    }),
                                                    new sap.ui.core.Item({
                                                        text: "{i18n>FALSE}",
                                                        key: false
                                                    })     
                                                ],                    
                                                layoutData: [new sap.ui.layout.GridData({
                                                    span: "L4 M4 S4",
                                                    linebreak: false
                                                })],
                                            })
                                        );
                                    },
        /*Generates the date time picker for timestamp data type of the legal ground detail
          considering whether range is enabled or not
          parameters:
            1) legalGroundDetailsForm - dynamically created form for each legal ground detail to which the corressponding
                                        controls would be added
            2) selectionCriteria - contains the data for each legal ground detail*/
        generateDateInputController: function(legalGroundDetailsForm, selectionCriteria) {
            if (!(selectionCriteria.isRangeEnabled)) {
                legalGroundDetailsForm.addContent(
                    new sap.m.DatePicker({
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })],
                        change: [this.onLiveUserInput, this]
                    })
                );
            } else {
                legalGroundDetailsForm.addContent(
                    new sap.m.DatePicker({
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })],
                        placeholder: "{i18n>RANGE_ENABLED_PLACEHOLDER_FROM}",
                        change: [this.onLiveUserInput, this]
                    })
                );
                legalGroundDetailsForm.addContent(
                    new sap.m.DatePicker({
                        layoutData: [new sap.ui.layout.GridData({
                            span: "L4 M4 S4",
                            linebreak: false
                        })],
                        placeholder: "{i18n>RANGE_ENABLED_PLACEHOLDER_TO}",
                        change: [this.onLiveUserInput, this]
                    })
                );
            }
        },
        /*Generates the processing mode subsection with two options
        1) Test Mode - enabled when simulation is supported (if not disabled) and is selected by default
        2) Production Mode - always enabled and is selected by default when simulation is not supported
        Parameters:
         1) selectionCriteriaSubsection - the processing mode subsection is added to this subsection
         2) isRadioButtonEnabled - boolean value indicating if simulation is supported for archive*/
        generateProcessingModeSection: function(selectionCriteriaSubsection, isRadioButtonEnabled) {
            var selectedIndex;
            if (!(isRadioButtonEnabled)) {
                selectedIndex = 1
            }
            var processingModeSubsection = new sap.uxap.ObjectPageSubSection({
                title: "{i18n>PROCESSING_MODE_TITLE}"
            });
            var processingModeForm = new sap.ui.layout.form.SimpleForm({
                layout: "ResponsiveGridLayout",
                singleContainerFullSize: false
            });
            var processingModeRadioButtonGroup = new sap.m.RadioButtonGroup({
                selectedIndex: selectedIndex
            });
            var processingModeRadioButton;
            processingModeRadioButton = new sap.m.RadioButton({
                text: "{i18n>PROCESSING_MODE_TEST}",
                enabled: isRadioButtonEnabled
            });
            processingModeRadioButtonGroup.addButton(processingModeRadioButton);
            processingModeRadioButton = new sap.m.RadioButton({
                text: "{i18n>PROCESSING_MODE_PRODUCTION}"
            });
            processingModeRadioButtonGroup.addButton(processingModeRadioButton);
            processingModeSubsection.addBlock(processingModeRadioButtonGroup);
            selectionCriteriaSubsection.addSubSection(processingModeSubsection);
        },
                /* is invoked when any of the value help controls that are dynamically generated in
           the selection criteria subsection is triggered
           variables holding custom data values:
            1) legalGroundName : name of the current legal ground being processed
            2) valueHelpEndPoint : value help endpoint(encoded format) to fetch the legal ground details data 
            3) selectedApplicationGroup : name of the selected application group
            4) selectionCriteriaName : name of the current legal ground detail that is being processed
           custom data is obtained from the numeric and string value help controls           
           ValueHelpInputControl - reference to the value help input field passed on so that the selected data can be set to this
                                   field on value help select
            calls the function to create value help dialog*/
            onDynamicValueHelpRequested: function(oEvent) {
                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                sap.ui.core.BusyIndicator.show();
                var LegalGroundName = oEvent.getSource().getCustomData()[0].getValue();
                var valueHelpEndpoint = oEvent.getSource().getCustomData()[1].getValue();
                var selectionCriteriaName = oEvent.getSource().getCustomData()[2].getValue();
                var valueHelpInputControl = oEvent.getSource();
                var that = this;
                var payload = {
                    "legalgroundName": LegalGroundName,
                    "valueHelpEndpoint": valueHelpEndpoint
                };
                console.log(valueHelpEndpoint);
                this.fetchLegalGroundDetailsValueHelp(payload).then(function(LegalGroundDetailValueHelpData) {
                    sap.ui.core.BusyIndicator.hide();
                    that.createDynamicValueHelpSelectDialog(LegalGroundDetailValueHelpData, valueHelpInputControl, selectionCriteriaName);
                }).catch(function(err) {
                    sap.ui.core.BusyIndicator.hide();
    
                    // instead of showing error dialog we are showing an empty value help.
                    that.createDynamicValueHelpSelectDialog([], valueHelpInputControl, selectionCriteriaName);
                    // that.generateErrorMessage();
                });
            },
    

        

        /*Backend call to fetch tha data to be bound with the dynamically generated legalgound valuehelp
          parameters passed: 
           1) legalGroundValueHelpPayload - contains the legal ground names and the corressponding valuehelp url
              in encoded format
           2) selectedApplicationGroupName - applicationGroup name selected by the user
           returns: data corressponding to the particular legal ground detail
        */
        fetchLegalGroundDetailsValueHelp: function(legalGroundValueHelpPayload) {
            var that = this;
            return new Promise(function(resolve, reject) {
                console.log(legalGroundValueHelpPayload.valueHelpEndpoint)
                var requestDetails = {
                    url: legalGroundValueHelpPayload.valueHelpEndpoint,
                    method: "GET",
                    payload: legalGroundValueHelpPayload
                }
                $.ajax({
                    url : requestDetails.url,
                    type : "GET",
                    dataType:"json",
                    async:false,
                    contentType:"application/json",
                    success :function(oResponse) {
                        if(oResponse){
                            that.oModel=new JSONModel(oResponse);
                            that.getView().setModel(that.oModel, "oFilterModel3");
                            console.log( that.getView().getModel("oFilterModel3").getData())
                            resolve(oResponse);
                            
                        }else{
                            MessageBox.error("Error");
                        }
                    },
                    error:function(error){
                        reject(MessageBox.error(error));
                    }
        
                        
                });
            });
        },
        /*Creates the dynamic value help dialog
          Parameters: 
          1) LegalGroundDetailValueHelpData - data to be bound to the dialog
          2) valueHelpInputControl - refernce to the value help input control (also added as custom data)
          3) selectionCriteriaName - legal ground detail name to be displayed as the value help title*/
          createDynamicValueHelpSelectDialog: function(LegalGroundDetailValueHelpData, valueHelpInputControl, selectionCriteriaName) { //475           
            var legalGroundValueHelpModel = new JSONModel(LegalGroundDetailValueHelpData);
            var legalGroundDetailSelectDialog = new sap.m.SelectDialog({
                noDataText: "{i18n>APPLICATION_GROUP_DIALOG_NO_DATA_TEXT}",
                title: "Select " + selectionCriteriaName,
                search: this.handleDynamicApplicationValueHelpSearch,
                confirm: [this.handleDynamicApplicationValueHelpSelect, this],
                items: {
                    path: '/data',
                    template: new sap.m.StandardListItem({
                        title: "{Name}",
                        description: "{description}"
                    })
                }
            });
            legalGroundDetailSelectDialog.setModel(legalGroundValueHelpModel);
            legalGroundDetailSelectDialog.addCustomData((new sap.ui.core.CustomData({
                key: "valueHelpInputControl",
                value: valueHelpInputControl
            })))
            legalGroundDetailSelectDialog.open();
        },

         /*handles search even in the dynamically generated value help dialog*/
         handleDynamicApplicationValueHelpSearch: function(oEvent) {
            var searchString = oEvent.getParameter("value");
            var oFilter = new Filter("value", FilterOperator.Contains, searchString);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        /*handles the salection of data in the dynamic value help dialog and sets it to the corresponding control
          whose reference is passed*/
        handleDynamicApplicationValueHelpSelect: function(oEvent) {
            var valueHelpInputControl = oEvent.getSource().getCustomData()[0].getValue();
            var oLegalGroundDetail = oEvent.getParameter("selectedItem");
            var selectedLegalGroundDetailName = oLegalGroundDetail.getTitle();
            valueHelpInputControl.setValue(selectedLegalGroundDetailName)
        },

        //track the user input in the dynamically generated numeric, string and date type controls
        onLiveUserInput: function(oEvent) {
            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        },


    });

});