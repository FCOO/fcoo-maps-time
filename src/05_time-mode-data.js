/****************************************************************************
05_time-mode-data.js

****************************************************************************/
(function ($, L, moment, i18next, window/*, document, undefined*/) {
	"use strict";

    var ns        = window.fcoo = window.fcoo || {},
        nsMap     = ns.map = ns.map || {},
        nsTime    = nsMap.time = nsMap.time || {},
        unit      = nsTime.unit;

    nsTime.ready = false; //Wait for creating the application before the maps time are set

    //nowMoment = moment-object representing 'now' in hole hours. Is changed every 60 minutes at hole hour (16:00:00, 17:00:00 etc)
    nsTime.nowMoment = moment().startOf(unit);
/*
    nsTime.tmFixed     = 'FIXED';
    nsTime.tmRelative  = 'RELATIVE';
    nsTime.tmSelect    = 'SELECT';
    nsTime.tmAnimation = 'ANIMATION';

    nsTime.timeMode = nsTime.tmFixed;
*/

    /******************************************************************************
    TIME-MODE-DATA
    TimeModeData = object with methods and data for a specific timeMode
    TimeModeData.data = {
        currentMoment   : MOMENT
        currentRelative : NUMBER
        min             : NUMBER
        max             : NUMBER
        globalMin       : NUMBER
        globalMax       : NUMBER
        start           : NUMBER
        end             : NUMBER
    }
    Contains the current values and range for the different time-modes
    ******************************************************************************/
    var timeModeDataList = {};

    nsTime.getCurrentTimeModeData = function(){
        return timeModeDataList[nsTime.timeMode];
    };



    nsTime.onSetupLoaded.push(function(){
        //Create TimeModeData for all avaiable time-modes in timeModeDataList
        nsTime.timeOptions.timeModeList.forEach( mode => {
            timeModeDataList[mode] = new nsTime.TimeModeData( mode );
        });
    });


    nsTime.TimeModeData = function( mode ){
        this.mode = mode;

        var to  = nsTime.timeOptions,
            tmo = to.timeModeOptions;
        this.data = {
            min       : tmo[mode].min,
            max       : tmo[mode].max,
            globalMin : to.min,
            globalMax : to.max,
            start     : tmo[mode].start,
            end       : tmo[mode].end,

            currentRelative: 0,
            currentMoment  : nsTime.nowMoment.clone()
        };
        this.isRelative = nsTime.timeModeIsRelative(mode);
        this.isFixed = !this.isRelative;

        //MANGLER
        this.isInterval = (mode == nsTime.tmAnimation);

        this.tsList = [];

        //Update time-sliders at global events
        var eventFunc = this.redrawTimeSlider.bind(this);
        ns.events.on(ns.events.LANGUAGECHANGED, eventFunc);
        if (this.isFixed)
            ns.events.on(ns.events.DATETIMEFORMATCHANGED, eventFunc);

        ns.events.on( ns.events.TIMEMODECHANGED, this.onTimeModeChanged.bind(this) );

        ns.events.on( ns.events.CREATEAPPLICATIONFINALLY, this.onCreateApplicationFinally.bind(this) );

        //Add the time-mode data to application-settings
        ns.appSetting.add({
            id          : 'time_'+mode,
            callApply   : true,
            applyFunc   : this.apply.bind(this),
            defaultValue: {currentRelative: 0}
        });
    };

    nsTime.TimeModeData.prototype = {

        /********************************************************
        apply
        ********************************************************/
        apply: function( data ){
            if (this.applyCalledOnce)
                return;

            //If this mode is fixed and now and a fixed moment is saved => Use this moment, but
            //if it was saved more than two hours ago the new moment can not be in the past
            if (this.isFixed && data.currentMomentISO){
                this.data.currentMoment = moment(data.currentMomentISO);

                if (data.nowMomentISO){
                    var saveAtNowMoment = moment(data.nowMomentISO),
                        savedAtHoursAgo = moment().diff(saveAtNowMoment, unit);

                    //If the saved moment was save more than two hours ago and it now is in the past => set current time = now
                    if ((savedAtHoursAgo >= 2) && (this.data.currentMoment.isBefore(nsTime.nowMoment)))
                        this.data.currentMoment = nsTime.nowMoment.clone();
                }
            }

            //Set currentMoment after currentRelative or currentRelative after currentMoment depending on this.isRelative
            if (this.isRelative){
                this.data.currentRelative = data.currentRelative;
                this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);
            }
            else
                this.data.currentRelative = this.data.currentMoment.diff(nsTime.nowMoment, unit);

            this.applyCalledOnce = true;
        },

        /********************************************************
        save
        ********************************************************/
        save: function(){
            //console.log('>>>>>>>>>> SAVE', this.mode, this.data.currentRelative );
            var data = {
                    currentRelative: this.data.currentRelative
                };
            if (this.isFixed){
                data.nowMomentISO = moment().format();
                if (this.data.currentMoment)
                    data.currentMomentISO = this.data.currentMoment.format();
            }

            if (this.isInterval){
                data.start = this.data.start;
                data.end   = this.data.end;
            }

            ns.appSetting.set('time_'+this.mode, data);
            ns.appSetting.save();
        },

        /********************************************************
        set
        ********************************************************/
        set: function( relative, redrawTimeSlider  ){
            if (this.updatingTimeSliders || !nsTime.ready)
                return;

            //console.log('>>>>>>>>>>> SET', this.mode, relative );

            this.data.currentRelative = relative;
            this.adjust();

            this.data.currentMoment = moment(nsTime.nowMoment).add(this.data.currentRelative, unit);

            if (!nsTime.ready)
                return;

            this.save();

            if (this.mode == nsTime.timeMode){
                this.updateBottomMenuElements(redrawTimeSlider);

                //Update current time on all maps
                nsMap.callAllMaps('_updateTime');
            }

        },

        /********************************************************
        setDelta
        ********************************************************/
        setDelta: function( delta ){
            this.set( this.data.currentRelative + delta );
        },

        /********************************************************
        adjust
        ********************************************************/
        adjust: function(){
            this.data.currentRelative = window.roundToRange(this.data.currentRelative, this.data.min, this.data.max);
        },

        /********************************************************
        updateBottomMenuElements
        ********************************************************/
        updateBottomMenuElements: function(redrawTimeSlider){
            var currentRelative = this.data.currentRelative,
                $container = nsMap.main.bottomMenu.$container;

            //Update elements in bottom-menu with current time and current relative
            $container.find('.is-current-moment').vfValue(this.data.currentMoment);

            //Releative time needs to be relative to 'true now' = moment()
            $container.find('.is-current-relative').vfValue( moment().add(currentRelative, unit) );

            //Enable/disable forward and backward buttons
            var isFirst = currentRelative == this.data.min,
                isLast  = currentRelative == this.data.max;

            $container.find('.btn-time-step-backward').toggleClass('disabled', isFirst);
            $container.find('.btn-time-step-forward').toggleClass('disabled', isLast);

            //Update style etc. for all elementSets
            nsTime.bottomMenu_onCurrentRelativeChanged(currentRelative);

            //Update value for buttons with time-slider
            nsTime.updateSliderButtons(currentRelative);

            if (redrawTimeSlider)
                this.redrawTimeSlider();

            this.updateTimeSlider();

        },

        /********************************************************
        updateTimeSlider
        ********************************************************/
        updateTimeSlider: function(){
            this.updatingTimeSliders = true;
            this.tsList.forEach(timeSlider => {
                if (this.isInterval){
                    //MANGLER: Hvis det er en timeSlider med start - end skal en anden metode end setValue bruges
                }
                else
                    timeSlider.setValue( this.data.currentRelative );
            }, this);
            this.updatingTimeSliders = false;
        },

        /********************************************************
        redrawTimeSlider
        ********************************************************/
        redrawTimeSlider: function(){
            this.tsList.forEach(timeSlider => {
                timeSlider.setFormat();
            });
        },

        /********************************************************
        onNowChanged
        ********************************************************/
        onNowChanged: function(){
            var newCurrentRelative = this.data.currentRelative;

            //Called when now changed: Check if fixed modes still are inside the range
            if (this.isFixed)
                newCurrentRelative = Math.max( this.data.currentMoment.diff(nsTime.nowMoment, unit), this.data.min );

            /* eslint-disable no-console */
            if (window.FCOOMAPSTIME_TEST_NOW)
                console.log('Relative for '+this.mode+' change from '+ this.data.currentRelative+' to '+newCurrentRelative);
            /* eslint-enable no-console */

            this.data.currentRelative = newCurrentRelative;

            this.onTimeModeChanged();
        },

        /********************************************************
        onTimeModeChanged
        ********************************************************/
        onTimeModeChanged: function(){
            this.set(this.data.currentRelative, true);
        },

        /********************************************************
        onCreateApplicationFinally
        ********************************************************/
        onCreateApplicationFinally: function(){
            //Make ref to all time-sliders with same time-mode
            this.tsList = [];
            nsTime.tsList.forEach(timeSlider => {
                if (timeSlider.options.timeMode == this.mode){
                    this.tsList.push( timeSlider );
                    timeSlider.setFormat();
                }
            }, this);

            this.set(this.data.currentRelative );
        }
    }; //end of nsTime.TimeModeData.prototype


    /******************************************************************
    When the site is fully created:
    - Set up intervals to update nsTime.nowMoment
    - Update current time-mode-data and all elements
    ******************************************************************/
    function setNowMoment( dummy, now ){
        nsTime.nowMoment = (now ? now : moment()).startOf(unit);
        $.each( timeModeDataList, function(id, timeModeData){
            timeModeData.onNowChanged();
        });

        //Update range etc. on all maps
        nsMap.callAllMaps('_updateNow');

    }

    nsMap.addFinallyEvent(function(){

        nsTime.ready = true;

        //***** TEST *****
        if (window.FCOOMAPSTIME_TEST_NOW){
            //TEST: now is 'moved' 1 hour every 10 seconds
            var testNow = moment().startOf(unit);
            var intervals = new window.Intervals({durationUnit: 'seconds'});
            intervals.addInterval({
                duration: 10,
                data    : {},
                resolve : function(){
                    testNow.add(1, unit);
                    /* eslint-disable no-console */
                    console.log('Now = ', testNow.toString());
                    /* eslint-enable no-console */
                    setNowMoment( {}, testNow);
                }
            });
            window.__jbs_getNowMoment = function(){ return moment(testNow); };
        }
        //***** TEST END *****
        else
            window.intervals.addInterval({
                duration: moment.duration(1, unit).asMinutes(),
                data    : {},
                resolve : setNowMoment
            });
    });

}(jQuery, L, window.moment, window.i18next, this, document));