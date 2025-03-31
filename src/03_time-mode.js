/****************************************************************************
time-modes
****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};

    /******************************************************************
    TIME-MODE
    Txhere are four possible modes to display and select current time/moment:
    'FIXED', 'SELECT', 'RELATIVE', or 'ANIMATION'
    ******************************************************************/
    nsTime.tmFixed     = 'FIXED';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    //nsTime.timeMode = The current selected time-mode
    nsTime.timeMode = nsTime.tmFixed;

    var timeModeInfo = {}; //{TIMEMODE}{relative, name, description}

    timeModeInfo[nsTime.tmFixed] = {
        name: {
            da: 'Fast tidspunkt',
            en: 'Fixed time'
        },
        description: {
            da: 'Vælg et fast dato og klokkeslet.<br>F.eks. <em>12. juni kl. 13:00</em>.',
            en: 'Select a fixed date and time.<br>Eq. <em>July 12th at 13:00"</em>.'
        }
    };

    timeModeInfo[nsTime.tmRelative] = {
        relative: true,
        name: {
            da: 'Relativt til aktuelle klokkeslet',
            en: 'Relative to current time'
        },
        description: {
            da: 'Vælg relativt til aktuelle tidspunkt.<br>F.eks. <em>"Nu plus 2 timer".</em><br>Dato og klokkeslet opdateres automatisk, når aktuelle tidspunkt ændre sig.',
            en: 'Select relative to current time.<br>Eq. <em>"Now plus 2 hours".</em><br>The time is automatic updated when the current time change.',
        }
    };
    timeModeInfo[nsTime.tmSelect] = {
        name: {
            da: 'SELECT',   //TODO
            en: 'SELECT'    //TODO
        },
        description: {
            da: '',
            en: ''
        }
    };
    timeModeInfo[nsTime.tmAnimation] = {
        relative: true,
        name: {
            da: 'Animation',
            en: 'Animation'
        },
        description: {
            da: '',
            en: ''
        }
    };

    nsTime.onSetupLoaded.push( function(){
        //Add timeMode to application-settings
        ns.appSetting.add({
            id          : 'timeMode',
            callApply   : true,
            applyFunc   : function( timeMode ){
                if (nsTime.timeOptions.timeModeList.indexOf(timeMode) >= 0)
                    nsTime.timeMode = timeMode;

                $.each(timeModeInfo, function(id){
                    window.modernizrToggle('time-mode-'+id, id == nsTime.timeMode);
                });
            },
            defaultValue: nsTime.timeMode,
            globalEvents: ns.events.TIMEMODECHANGED,
        });
    });

    nsTime.timeModeIsRelative = function( timeMode ){
        return !!timeModeInfo[timeMode || nsTime.timeMode].relative;
    };


    /***************************************
    selectTimeMode - Modal-form with info and select of time-mode
    ***************************************/
    nsTime.selectTimeMode = function(){
        var list = [],
            allowDifferentTime = nsTime.timeOptions.allowDifferentTime,
            helpText = {
                da: (allowDifferentTime ? 'Tiden for ' + (nsMap.hasMultiMaps ? 'hovedkortet' : 'kortet') : 'Tiden') + ' vælges med skala eller frem- og tilbage-knapper forneden.',
                en: (allowDifferentTime ? 'The time for the ' + (nsMap.hasMultiMaps ? 'main' : '') + ' map' : 'The time') + ' is selected using the scale or the forward- and backward-buttons at the bottom.'
            };

        $.each(timeModeInfo, function(id, timeMode){
            if (nsTime.timeOptions.timeModeList.includes(id)){
                list.push({
                    id  : id,
                    icon: timeMode.icon,
                    text: timeMode.name
                });

                $.each( helpText, function(lang){
                    helpText[lang] = helpText[lang] + '<br>&nbsp;<br><strong>' + timeMode.name[lang] + '</strong><br>' + timeMode.description[lang];
                });
            }
        });

        //Add buttons to settings for date-format and time zone
        let buttons = [];
        ['TIMEZONECHANGED','DATETIMEFORMATCHANGED'].forEach( id => {
            let accOptions = ns.globalSettingAccordion(id);
            buttons.push({
                icon   : accOptions.header.icon,
                text   : window.bsIsTouch ? null : accOptions.header.text,
                square : window.bsIsTouch,
                bigIcon: window.bsIsTouch,
                onClick: function(){ ns.globalSetting.edit(id); },
            });
        });

        $.bsModalForm({
            header  : {
                icon:'far fa-clock',
                text: {
                    da: allowDifferentTime ? 'Tidsindstillinger for ' + (nsMap.hasMultiMaps ? 'hovedkortet' : 'kortet') : 'Tidsindstilling',
                    en: allowDifferentTime ? 'Time Setting for the ' + (nsMap.hasMultiMaps ? 'main' : '') + ' map'      : 'Time Setting'
                }
            },
            flexWidth: true,
            content : [{
                id           : 'timeMode',
                type         : 'radiobuttongroup',
                buttonType   : 'bigiconbutton',
                vertical     : true,
                fullWidth    : true,
                buttonOptions: { bold: true },
                list         : list
            },{
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                //small: window.bsIsTouch,
                //textClass: 'font-size-0-9em',
                text : helpText
            }],
            buttons: buttons,
            onSubmit: function(data){
                ns.appSetting.set(data);
            }
        }).edit({timeMode: nsTime.timeMode});
    };


    /******************************************************************
    SECONDARY MAP TIME-SYNC
    Each secondary maps have a one of the following time-sync
    tsMain: The time is the same as in the main-map with -24 - to +24 hours offset
    tsNow : The time is the same as 'Now' with -24 - to +24 hours offset
    ******************************************************************/
    /*
    "på nuværende tidspunkt" engelsk oversættelse
    på nuværende tidspunkt {adv.}EN
    "at this time" or "at the current moment"
    */
    nsTime.tsMain = 'MAIN';
    nsTime.tsNow  = 'NOW';


    //nsTime.timeSyncInfo = {TIMESYNC}{name, description, relativePrefix_List, relativePrefix_Ctrl}
    nsTime.timeSyncInfo = {};
    nsTime.timeSyncInfo[nsTime.tsMain] = {
        name: {
            da: 'Den samme som på hovedkortet',
            en: 'The same as on the main map'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da:'Samme som hovedkortet', en:'Same as main map'},
        relativePrefix_List: {da: 'Hovedkort', en: 'Main map'}, //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: '', en: ''},                  //Prefix for offset in bsTimeInfoControl

        iconColor      : ['icon-active', 'text-black', 'icon-active']
    };

    nsTime.timeSyncInfo[nsTime.tsNow] = {
        name: {
            da: 'Nuværende tidspunkt (Nu)',
            en: 'Current moment (Now)'
        },
        description: {
            da: '',
            en: ''
        },
        zeroOffset         : {da: 'Nu', en: 'Now'},
        relativePrefix_List: {da: 'Nu', en: 'Now'},     //Prefix in list of offset in Setting
        relativePrefix_Ctrl: {da: 'Nu', en: 'Now'},   //Prefix for offset in bsTimeInfoControl

        iconColor      : ['time-past-color', 'time-now-color', 'time-future-color'],
    };

    nsTime.timeSyncIconColors = '';
    var timeSyncIconColorList = [];
    $.each(nsTime.timeSyncInfo, function(id, opt){
        timeSyncIconColorList.push(...opt.iconColor);
    });
    nsTime.timeSyncIconColors = timeSyncIconColorList.join(' ');

    nsTime.getIconClass = function(mode, offset){
        return nsTime.timeSyncInfo[mode].iconColor[
                   offset < 0 ? 0 :
                   offset == 0 ? 1 :
                   2
               ];
    };




    /*******************************************************
    Create content for time-sync-settings in MapSetting by prepend
    a create function to nsMap.mswcFunctionList (Map Setting With Control Function List) =
    Is a list of functions used to create Settings in MapSettingGroup using
    method addMapSettingWithControl when the MapSetting for each maps are created
    *******************************************************/
    function timeSyncOptions_singleMap(idPostfix='', controlId=''){
        let content = [],
            list    = [];

        $.each(nsTime.timeSyncInfo, function(id, options){
            list.push({
                id  : id,
                icon: [['fas fa-clock text-white', 'far fa-clock ' + nsTime.getIconClass(id, 0)]],
                text: options.name
            });

            var timeItems = [], text;
            [-24,-12,-6,-3,-2,-1, 0, 1,2,3,6,12,24].forEach( offset => {
                if (offset){
                    text = (offset > 0 ? ' + ' : ' - ') + Math.abs(offset);
                    var isOneHour = (Math.abs(offset) == 1);
                    text = {
                        da: options.relativePrefix_List.da + ' ' + text + (isOneHour ? ' time' : ' timer'),
                        en: options.relativePrefix_List.en + ' ' + text + (isOneHour ? ' hour' : ' hours')
                    };
                }
                else
                    text = options.zeroOffset;

                timeItems.push({
                    id  : 'offset_'+offset,
                    icon: [['fas fa-clock text-white', 'far fa-clock ' + nsTime.getIconClass(id, offset)]],
                    text: text
                });
            });

            let showWhen = {};
            showWhen[(controlId ? controlId+'_' : '') + 'mode'+idPostfix] = id;
            content.push({
                id       : id+'Offset'+idPostfix,
                label    : {da:'Forskydning (plus/minus antal timer)', en:'Shift (plus/minus number of hours)'},
                type     : 'selectbutton',
                fullWidth: true,
                items    : timeItems,
                showWhen : showWhen,
                freeSpaceWhenHidden: true
            });
        });

        content.unshift({
            id          : 'mode'+idPostfix,
            label       : {da: 'Tiden på dette kort er', en: 'The time on this map is'},
            type        : 'radiobuttongroup',
            buttonType  : 'bigiconbutton',
            vertical    : true,
            fullWidth   : true,
            items       : list,
        });
        return content;
    }

    function mapSettingGroup_editCommonTimeSyncSetting(){
        nsMap.mapSettingGroup_mapSyncForm({
            controlId: 'bsTimeInfoControl',
            header   : nsTime.msgHeader_timeSync,
            flexWidth: window.bsIsTouch,
            buttons  : [{
                icon: ns.settingIcon('fa-clock-eight'),
                text: {da:'Hovedkort', en: 'Main map'},
                onClick: nsTime.selectTimeMode
            }],
            desc     : {
                da: 'Tiden på et kort er enten<ul><li>Samme tidspunkt som på hovedkortet, eller</li><li>Aktuelle tidspunkt (Nu)</li></ul>Begge med mulighed for forskydning &#177; 1-24t',
                en: 'The time on a map is<ul><li>The same time as on the main map, or</li><li>Current time (Now)</li></ul>Both with posible offset &#177; 1-24h'
            },

            getMapContent: timeSyncOptions_singleMap,

            getMapSetting: function(mapIndex, map){
                let state = map.bsTimeInfoControl.getState(),
                    data  = {};
                ['mode', 'NOWOffset', 'MAINOffset'].forEach( id => data[id+mapIndex] = state[id] );
                return data;
            },

            setMapSetting: function(mapIndex, map, data){
                let state = {};
                ['mode', 'NOWOffset', 'MAINOffset'].forEach( id => state[id] = data[id+mapIndex] );
                nsMap.getMapSettingGroup(map).saveParent({ bsTimeInfoControl: state });
            }
        });
    }


    nsTime.msgTimeSync = 'timeSync';
    nsTime.msgHeader_timeSync = {
        icon       : 'far fa-clock',
        text       : {da:'Tidsindstillinger', en:'Time Settings'},
        smallText  : {da:'Tid', en:'Time'}
    };

    nsTime.create_MapSettingGroup_content = function(){
        //Setting for secondary maps
        nsMap.msgAccordionAdd({
            accordionId: nsTime.msgTimeSync,
            header     : nsTime.msgHeader_timeSync,
            editCommon : mapSettingGroup_editCommonTimeSyncSetting

        }, true);

        //Create setting-content for secondary maps = Select mode and offset to main map/now
        nsMap.mswcFunctionList.unshift( function(map){
            if (map.options.isMainMap)
                return;

            let controlId = 'bsTimeInfoControl';

            let idList = ['mode'];
            $.each(nsTime.timeSyncInfo, id => idList.push(id+'Offset') );

            let modalContent = timeSyncOptions_singleMap('', controlId);
            //Add help
            modalContent.push({
                label: {da: 'Vejledning', en:'Guidance'},
                type : 'text',
                small: window.bsIsTouch,
                textClass: 'font-size-0-9em',
                text : {
                    da: 'Tiden på dette kort er enten<ul><li>Samme tidspunkt som på hovedkortet, eller</li><li>Aktuelle tidspunkt (Nu)</li></ul>Begge med mulighed for forskydning &#177; 1-24t',
                    en: 'The time on this map is<ul><li>The same time as on the main map, or</li><li>Current time (Now)</li></ul>Both with posible offset &#177; 1-24h'
                }
            });

            this.addMapSettingWithControl({
                controlId   : controlId,
                accordionId : nsTime.msgTimeSync,
                id          : idList,
                header      : nsTime.msgHeader_timeSync,
                modalContent: modalContent
            });
        });
    };

}(jQuery, L, window.moment, window.i18next, this, document));




