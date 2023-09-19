/****************************************************************************
 L.Control.BsTimeInfoControl.js

Leaflet control to display current time and relative time in the maps

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {};


    /******************************************************************
    L.Control.BsTimeInfoControl
    Control to show current time and info on time sync with main map
    ******************************************************************/
    L.Control.BsTimeInfoControl = L.Control.BsButtonBox.extend({
        options: {
            //small          : window.bsIsTouch,
            icon           : 'far fa-lg fa-clock',
            tooltipOnButton: true,
            square         : true,
            className      : 'time-info-control',   //Class-names for the container
            class          : 'show-as-normal',      //Class-names for <a>-buttons To allow the button to be 'normal' when disabled
            semiTransparent: false,

            extendedButton: {
                //small          : window.bsIsTouch,
                icon           : 'far fa-clock',
                text           : ['12:00 am(+1)'],
                textClass      : ['current-time'],
                square         : false,
                semiTransparent: false,
            }
        },

        /***********************************************************
        initialize
        ***********************************************************/
        initialize: function(options){
            options = $.extend(true, {}, this.options, options || {});

            var isMainMap      = options.isMainMap,
                isSecondaryMap = !isMainMap;

            //Adjust content
            if (isSecondaryMap){
                //Secondary in normal-mode = icon and relative text
                $.extend(/*this.*/options, {
                    square   : false,
                    icon     : 'far fa-clock',
                    text     : '+12t',
                    textClass: 'time-sync-info-text'
                });

                //Secondary in extended-mode = icon and time and relative text
                options.extendedButton.text.push('+24h');
                options.extendedButton.textClass.push('time-sync-info-text');
            }


            //Add items to popup-list: Main or global mode = select time-mode, secondary = select relative mode
            options.popupList = [];

            //Header - MANGLER
/*
            options.popupList.push({
                icon: 'far fa-clock',
                text: 'MANGLER'
            });
*/

            if ( (isMainMap && (nsTime.timeOptions.timeModeList.length > 1) ||
                 (isSecondaryMap && !nsTime.timeOptions.allowDifferentTime)) )
                options.popupList.push({
                    type        : 'button',
                    icon        : 'far fa-clock',
                    text        : {da: 'Tidsindstillinger', en: 'Time Settings'},
                    onClick     : nsTime.selectTimeMode,
                    closeOnClick: true,
                    lineAfter   : true
                });

            if (isSecondaryMap && nsTime.timeOptions.allowDifferentTime)
                options.popupList.push({
                    type        : 'button',
                    icon        : nsTime.msgHeader_timeSync.icon,
                    text        : nsTime.msgHeader_timeSync.text,
                    onClick     : $.proxy(this.editSetting, this),
                    closeOnClick: true,
                    lineAfter   : true
                });


            //Add links to settings for timezone and date & time-format
            $.each(['TIMEZONECHANGED','DATETIMEFORMATCHANGED'], function(index, id){
                var accOptions = ns.globalSettingAccordion(id);
                options.popupList.push({
                    type     : 'button',
                    icon     : accOptions.header.icon,
                    text     : accOptions.header.text,
                    onClick  : function(){ ns.globalSetting.edit(id); },
                    closeOnClick: true,
                });
            });

            return L.Control.BsButtonBox.prototype.initialize.call(this, options);
        },

        /***********************************************************
        onAdd
        ***********************************************************/
        onAdd: function(map){
            var result = L.Control.BsButtonBox.prototype.onAdd.call(this, map);

            //Find this.$currentTime = $-elements holding the current time of the map
            this.$currentTime = $(result).find('span.current-time');

            this.$currentTime.vfFormat('time_now_sup');

            //Find this.$relative = $-elements holding info on relative mode eq. "Now +12h"
            this.$relative = $(result).find('span.time-sync-info-text');
            this.$relative.css({
                'border-left' : '1px solid gray',
                'padding-left': '.35em'
            });

            map.on("momentchanged", this.onMomentChanged, this);

            return result;
        },

        /***********************************************************
        editSetting
        ***********************************************************/
        editSetting: function(){
            nsMap.editMapSetting(this._map.fcooMapIndex, {msgAccordionId: nsTime.msgTimeSync} );
        },

        /************************************************************
        setState
        ************************************************************/
        setState: function(BsButtonBox_setState){
            return function (options) {
                BsButtonBox_setState.call(this, options);
                this._map._setTimeSyncOptions( options );
                return this;
            };
        }(L.Control.BsButtonBox.prototype.setState),


        /************************************************************
        getState
        ************************************************************/
        getState: function(BsButtonBox_getState){
            return function () {
                var _this = this,
                    result = BsButtonBox_getState.call(this);

                if (!this.options.isMainMap){
                    result.mode = this.options.mode;

                    $.each(nsTime.timeSyncInfo, function(id/*, opt*/){
                        result[id+'Offset'] = _this.options[id+'Offset'];
                    });
                }
                return result;
            };
        }(L.Control.BsButtonBox.prototype.getState),



        /***********************************************************
        onMomentChanged
        ***********************************************************/
        onMomentChanged: function(time){
            var relative = time.relative || 0;
            this._map.$container
                .toggleClass('time-is-past',   relative < 0)
                .toggleClass('time-is-now',    relative == 0)
                .toggleClass('time-is-future', relative > 0);

        },

        /***********************************************************
        onChange
        ***********************************************************/
        onChange: function(/*options*/){
            if (this.options.isMainMap)
                return;

            var timeSyncOptions = this._map.timeSync || {},
                timeSyncMode = timeSyncOptions.mode || null,
                timeSyncInfo = timeSyncMode ? nsTime.timeSyncInfo[timeSyncMode] : {},
                asMain = timeSyncMode == nsTime.tsMain,
                offset = timeSyncOptions.offset || 0;


            this.bsButton.toggleClass('disabled', !this.options.show);

            //Bug fix to prevent multi call when other controls are changed
            var newTimeSyncAsStr = '' + JSON.stringify(this._map.timeSync) + (this.options.show ? 'On' : 'OFF') + timeSyncMode;
            if (!timeSyncMode || (this.timeSyncAsStr == newTimeSyncAsStr))
                return;

            this.timeSyncAsStr = newTimeSyncAsStr;

            //If mode is different from "as main" and the bsTimeInfoControl is hidden it is forced to be displayed disabled to allways see the time-offset
            var forcedShown = !this.options.show && (!asMain || !!offset);
            this.$container.toggleClass('forced-shown', forcedShown);

            forcedShown ? this.disable() : this.enable();

            //Update sync time (Now or relative time)
            this.$relative.empty().hide();
            if (!asMain || offset){
                var text = $.extend({}, timeSyncInfo.relativePrefix_Ctrl);
                if (offset){
                    var offsetText = (offset > 0 ? '+ ' : '- ') + Math.abs(offset);
                    text.da = text.da + (text.da ? ' ' : '') + offsetText+'t';
                    text.en = text.en + (text.en ? ' ' : '') + offsetText+'h';
                }
                this.$relative.i18n(text, 'html').show();
            }

            //Adjust the button:
            //Set icon color for mode and offset
            this.$container.find('i')
                .removeClass(nsTime.timeSyncIconColors)
                .addClass( nsTime.getIconClass(timeSyncMode, offset) );



            //If same as main map  => normal button: shape = square and big icon and no margin
            var isSquare = asMain && !offset;
            this.bsButton.toggleClass('square', isSquare);
            this.bsButton.find('i').toggleClass('fa-lg fa-no-margin', isSquare);

            //Update current time of the map
            this._map._updateTime();
        },
    });



    L.Map.addInitHook(function () {
        this.on('showinmultimaps', this._updateTime, this);

        if (this.options.bsTimeInfoControl) {
            this.bsTimeInfoControl = new L.Control.BsTimeInfoControl( this.options.bsTimeInfoControlOptions );
            this.addControl(this.bsTimeInfoControl);
        }
    });


}(jQuery, L, window.moment, window.i18next, this, document));




